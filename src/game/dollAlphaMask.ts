/**
 * 인형 PNG의 알파 채널 마스크 — 픽셀(실루엣) 기반 잡기 판정용.
 *
 * 렌더 박스(정사각, object-fit: contain)와 동일한 좌표계로 마스크를 만들어
 * 박스 내 (u, v) ∈ [0,1]² 지점의 불투명도를 바로 조회할 수 있게 한다.
 */

export type DollAlphaMask = {
  /** 마스크 한 변의 픽셀 수 (정사각) */
  size: number
  /** size×size 알파 값 (0–255), row-major */
  data: Uint8Array
}

const MASK_SIZE = 96

const maskCache = new Map<string, DollAlphaMask>()
const pendingLoads = new Map<string, Promise<DollAlphaMask | null>>()

/** img.src(절대 URL)와 import 경로가 달라도 같은 마스크를 찾도록 */
function normalizeMaskKey(src: string): string {
  if (!src) return src
  const withoutQuery = src.split('?')[0] ?? src
  const assetsIdx = withoutQuery.lastIndexOf('/assets/')
  if (assetsIdx >= 0) return withoutQuery.slice(assetsIdx)
  try {
    return new URL(src, window.location.href).pathname
  } catch {
    return withoutQuery
  }
}

function storeMask(src: string, mask: DollAlphaMask) {
  maskCache.set(normalizeMaskKey(src), mask)
}

function lookupMask(src: string): DollAlphaMask | null {
  const key = normalizeMaskKey(src)
  if (maskCache.has(key)) return maskCache.get(key)!
  if (maskCache.has(src)) return maskCache.get(src)!
  for (const [cachedKey, mask] of maskCache) {
    if (key.endsWith(cachedKey) || cachedKey.endsWith(key)) return mask
  }
  return null
}

function buildMaskFromImage(image: HTMLImageElement): DollAlphaMask | null {
  const canvas = document.createElement('canvas')
  canvas.width = MASK_SIZE
  canvas.height = MASK_SIZE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  // object-fit: contain과 동일 — 비율 유지, 박스 중앙 정렬
  const aspect = image.naturalWidth / image.naturalHeight
  let drawW = MASK_SIZE
  let drawH = MASK_SIZE
  if (aspect > 1) drawH = MASK_SIZE / aspect
  else drawW = MASK_SIZE * aspect

  ctx.drawImage(
    image,
    (MASK_SIZE - drawW) / 2,
    (MASK_SIZE - drawH) / 2,
    drawW,
    drawH,
  )

  const pixels = ctx.getImageData(0, 0, MASK_SIZE, MASK_SIZE).data
  const data = new Uint8Array(MASK_SIZE * MASK_SIZE)
  for (let i = 0; i < data.length; i += 1) {
    data[i] = pixels[i * 4 + 3]
  }

  return { size: MASK_SIZE, data }
}

export function loadDollAlphaMask(src: string): Promise<DollAlphaMask | null> {
  const cached = lookupMask(src)
  if (cached) return Promise.resolve(cached)

  const key = normalizeMaskKey(src)
  const pending = pendingLoads.get(key)
  if (pending) return pending

  const promise = new Promise<DollAlphaMask | null>((resolve) => {
    const image = new Image()
    image.onload = () => {
      const mask = buildMaskFromImage(image)
      if (mask) storeMask(src, mask)
      pendingLoads.delete(key)
      resolve(mask)
    }
    image.onerror = () => {
      pendingLoads.delete(key)
      resolve(null)
    }
    image.src = src
  })

  pendingLoads.set(key, promise)
  return promise
}

export function preloadDollAlphaMasks(srcs: readonly string[]) {
  return Promise.all(srcs.map(loadDollAlphaMask))
}

/** 로드 완료된 마스크 동기 조회 (미로드 시 null) */
export function getDollAlphaMask(src: string): DollAlphaMask | null {
  return lookupMask(src)
}

/** 렌더 박스 내 (u, v) ∈ [0,1]² 지점의 알파 (박스 밖이면 0) */
export function sampleDollAlpha(mask: DollAlphaMask, u: number, v: number): number {
  if (u < 0 || u > 1 || v < 0 || v > 1) return 0
  const x = Math.min(mask.size - 1, Math.floor(u * mask.size))
  const y = Math.min(mask.size - 1, Math.floor(v * mask.size))
  return mask.data[y * mask.size + x]
}

/** 렌더 박스(정사각) 대비 불투명 영역 경계 (0–1 분수) */
export type DollOpaqueBounds = {
  left: number
  top: number
  right: number
  bottom: number
}

const ALPHA_THRESHOLD = 16
export { ALPHA_THRESHOLD as DOLL_ALPHA_THRESHOLD }
const boundsCache = new Map<string, DollOpaqueBounds>()

function computeOpaqueBounds(mask: DollAlphaMask): DollOpaqueBounds | null {
  const { size, data } = mask
  let minX = size
  let minY = size
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (data[y * size + x] > ALPHA_THRESHOLD) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < minX || maxY < minY) return null

  return {
    left: minX / size,
    top: minY / size,
    right: (maxX + 1) / size,
    bottom: (maxY + 1) / size,
  }
}

/** 로드된 마스크에서 불투명 경계 동기 조회 (미로드 시 null) */
export function getDollOpaqueBounds(src: string): DollOpaqueBounds | null {
  const key = normalizeMaskKey(src)
  const cached = boundsCache.get(key)
  if (cached) return cached

  const mask = lookupMask(src)
  if (!mask) return null

  const bounds = computeOpaqueBounds(mask)
  if (bounds) boundsCache.set(key, bounds)
  return bounds
}

/**
 * 컬럼(x)별 최상단 불투명 v (0–1 분수). 빈 컬럼은 1.
 * 집게가 위에서 내려올 때 실루엣 윤곽에 닿는 높이 판정용.
 */
const columnTopCache = new Map<string, Float32Array>()

export function getDollColumnTops(src: string): Float32Array | null {
  const key = normalizeMaskKey(src)
  const cached = columnTopCache.get(key)
  if (cached) return cached

  const mask = lookupMask(src)
  if (!mask) return null

  const { size, data } = mask
  const tops = new Float32Array(size).fill(1)
  for (let x = 0; x < size; x += 1) {
    for (let y = 0; y < size; y += 1) {
      if (data[y * size + x] > ALPHA_THRESHOLD) {
        tops[x] = y / size
        break
      }
    }
  }

  columnTopCache.set(key, tops)
  return tops
}

/**
 * 렌더 박스 가로 [u0,u1] 구간에서 실루엣 최상단 v (0–1). 불투명 픽셀 없으면 1.
 * flipX: faceScaleX === -1 일 때 좌우 반전 보정.
 */
export function getDollSilhouetteTopV(
  src: string,
  u0: number,
  u1: number,
  flipX: boolean,
): number | null {
  const tops = getDollColumnTops(src)
  if (!tops) return null

  const size = tops.length
  let a = Math.max(0, Math.min(u0, u1))
  let b = Math.min(1, Math.max(u0, u1))
  if (flipX) {
    const na = 1 - b
    const nb = 1 - a
    a = na
    b = nb
  }

  const xa = Math.max(0, Math.floor(a * size))
  const xb = Math.min(size - 1, Math.ceil(b * size) - 1)
  if (xb < xa) return 1

  let minV = 1
  for (let x = xa; x <= xb; x += 1) {
    if (tops[x] < minV) minV = tops[x]
  }
  return minV
}
