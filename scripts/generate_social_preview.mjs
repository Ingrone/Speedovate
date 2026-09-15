// Render a dedicated social card using the original branding asset.
import {readFile, writeFile, mkdtemp, rm} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const root = new URL('../', import.meta.url);
const logo = await readFile(new URL('assets/logo.png', root));
const temp = await mkdtemp(join(tmpdir(), 'speedovate-social-'));
try {
  const html = join(temp, 'preview.html');
  await writeFile(html, `<!doctype html><html><head><style>
    html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#FFFFFF}
    body{display:flex;align-items:center;justify-content:center}
    img{width:700px;height:auto;display:block}
  </style></head><body><img src="data:image/png;base64,${logo.toString('base64')}" alt="Speedovate"></body></html>`);
  const chrome = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const screenshot = join(temp, 'social-preview.png');
  const child = spawn(chrome, ['--headless', '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--window-size=1200,630', '--virtual-time-budget=1000', `--user-data-dir=${join(temp, 'profile')}`,
    `--screenshot=${screenshot}`, `file://${html}`], {stdio:'ignore'});
  let launchError;
  child.on('error', error => { launchError = error; });
  let png;
  try {
    for (let attempt = 0; attempt < 150; attempt++) {
      if (launchError) throw launchError;
      const candidate = await readFile(screenshot).catch(() => null);
      if (candidate?.subarray(-8, -4).toString() === 'IEND') {
        png = candidate;
        break;
      }
      if (child.exitCode !== null) throw new Error(`Chrome exited with ${child.exitCode} before creating the thumbnail`);
      await delay(100);
    }
    if (!png) throw new Error('Chrome did not create a complete thumbnail within 15 seconds');
  } finally {
    // Some Chrome versions keep running after writing the screenshot.
    if (child.exitCode === null) {
      child.kill('SIGTERM');
      await delay(300);
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }
  }
  await writeFile(new URL('social-preview.png', root), png);
  console.log('Generated social-preview.png (1200 × 630).');
} finally { await rm(temp, {recursive:true,force:true}); }
