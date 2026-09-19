import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const out = await fs.mkdtemp(path.join(os.tmpdir(), 'docs-unlisted-'));
try {
  for (const base of ['/', '/geetorus-docs/']) {
    execFileSync(process.execPath, ['site/build-release.mjs', '--base-path', base, '--out-dir', out]);
    const html = await fs.readFile(path.join(out, 'hosted-beta/index.html'), 'utf8');
    assert.match(html, /name="robots" content="noindex, follow"/);
    assert.equal((html.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
    assert.ok(html.includes(`<base data-seo-base href="${base}"`));
    assert.ok(html.includes('data-unlisted-page="hosted-beta"'));
    assert.ok(html.includes('id="sb-sections" data-server-rendered="true"'));
    assert.ok(html.includes('id="breadcrumb"'));
    for (const file of ['content.json', 'index.html', 'sitemap.xml']) {
      assert.ok(!(await fs.readFile(path.join(out, file), 'utf8')).includes('hosted-beta'), file);
    }
  }
  console.log('Unlisted beta page passes root/subpath and discovery checks.');
} finally {
  await fs.rm(out, { recursive: true, force: true });
}
