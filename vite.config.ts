import os from 'node:os'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function getLanIpv4() {
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return null
}

/** dev 서버 시작 시 휴대폰 접속 URL 출력 */
function mobileLanUrlPlugin(): Plugin {
  return {
    name: 'mobile-lan-url',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const address = server.httpServer?.address()
        const port =
          typeof address === 'object' && address !== null ? address.port : server.config.server.port

        if (!port) return

        const lanIp = getLanIpv4()
        if (!lanIp) return

        const url = `http://${lanIp}:${port}/`
        server.config.logger.info(
          `\n  📱 같은 Wi‑Fi 휴대폰에서 접속:\n     ${url}\n`,
          { timestamp: true },
        )
      })
    },
  }
}

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'sbi-game'
const base = process.env.GITHUB_PAGES === 'true' ? `/${repoName}/` : '/'

export default defineConfig({
  base,
  plugins: [react(), mobileLanUrlPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    open: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
    open: true,
  },
})
