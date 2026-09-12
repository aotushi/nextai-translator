import { readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'

const root = fileURLToPath(new URL('../', import.meta.url))
const { values } = parseArgs({
    options: {
        'identity-from': { type: 'string' },
        'version': { type: 'string' },
    },
})

let identity
if (values['identity-from']) {
    identity = JSON.parse(await readFile(resolve(values['identity-from']), 'utf8'))
    if (!identity.key) {
        throw new Error('The existing manifest has no public key; its extension ID cannot be preserved.')
    }
}
if (
    values.version &&
    (!/^\d+(\.\d+){0,3}$/.test(values.version) || values.version.split('.').some((part) => Number(part) > 65535))
) {
    throw new Error('Use a browser extension version with one to four numbers between 0 and 65535.')
}

for (const args of [
    ['node_modules/typescript/bin/tsc', '--noEmit'],
    ['node_modules/vite/bin/vite.js', 'build', '-c', 'vite.config.chromium.ts'],
]) {
    const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit', windowsHide: true })
    if (result.error) throw result.error
    if (result.status !== 0) process.exit(result.status ?? 1)
}

const manifestPath = resolve(root, 'dist/browser-extension/chromium/manifest.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
if (identity) manifest.key = identity.key
if (values.version) manifest.version = values.version
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
console.log(`Ready to load in Edge: ${resolve(root, 'dist/browser-extension/chromium')}`)
