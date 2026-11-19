// Vercel serves public/ from its CDN; /api/* is handled by index.py.
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const appDir = path.dirname(fileURLToPath(import.meta.url))
const frontendDir = path.join(appDir, 'frontend')

function npm(args) {
  // On Windows npm.cmd requires cmd.exe. All arguments here are fixed literals.
  const result = process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', 'npm ' + args.join(' ')], {
        cwd: frontendDir, stdio: 'inherit', windowsHide: true,
      })
    : spawnSync('npm', args, { cwd: frontendDir, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

npm(['ci', '--no-audit', '--no-fund'])
npm(['run', 'build', '--', '--outDir', '../public', '--emptyOutDir'])
