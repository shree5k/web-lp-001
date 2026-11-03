const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
if (args.some(arg => !['--preview', '--serve'].includes(arg))) throw new Error('Unknown build option');
// Always start from a clean output so unpublished/deleted articles cannot linger.
fs.rmSync(path.join(root, '_site'), { recursive: true, force: true });
const cli = path.join(root, 'node_modules/@11ty/eleventy/cmd.cjs');
const result = spawnSync(process.execPath, [cli, ...(args.includes('--serve') ? ['--serve'] : [])], {
  cwd: root, stdio: 'inherit',
  env: { ...process.env, BLOG_PREVIEW: args.includes('--preview') ? '1' : '0' }
});
process.exit(result.status ?? 1);
