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
  const cached = maskCache.get(src)
  if (cached) return Promise.resolve(cached)

  const pending = pendingLoads.get(src)
  if (pending) return pending

  const promise = new Promise<DollAlphaMask | null>((resolve) => {
    const image = new Image()
    image.onload = () => {
      const mask = buildMaskFromImage(image)
      if (mask) maskCache.set(src, mask)
      pendingLoads.delete(src)
      resolve(mask)
    }
    image.onerror = () => {
      pendingLoads.delete(src)
      resolve(null)
    }
    image.src = src
  })

  pendingLoads.set(src, promise)
  return promise
}

export function preloadDollAlphaMasks(srcs: readonly string[]) {
  return Promise.all(srcs.map(loadDollAlphaMask))
}

/** 로드 완료된 마스크 동기 조회 (미로드 시 null) */
export function getDollAlphaMask(src: string): DollAlphaMask | null {
  return maskCache.get(src) ?? null
}

/** 렌더 박스 내 (u, v) ∈ [0,1]² 지점의 알파 (박스 밖이면 0) */
export function sampleDollAlpha(mask: DollAlphaMask, u: number, v: number): number {
  if (u < 0 || u > 1 || v < 0 || v > 1) return 0
  const x = Math.min(mask.size - 1, Math.floor(u * mask.size))
  const y = Math.min(mask.size - 1, Math.floor(v * mask.size))
  return mask.data[y * mask.size + x]
}
