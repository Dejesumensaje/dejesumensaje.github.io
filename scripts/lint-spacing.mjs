import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Legacy files are not built. They stay out of the spacing contract.
const IGNORED = new Set([
  'src/components/Header.astro',
  'src/components/Footer.astro',
  'src/components/CaseNav.astro',
  'src/components/CaseTOC.astro',
  'src/components/ProjectCard.astro',
  'src/components/PasswordGate.astro',
  'src/layouts/BaseLayout.astro',
]);

const SPACING_DECLARATION =
  /\b(padding(?:-(?:block|inline|top|right|bottom|left))?|margin(?:-(?:block|inline|top|right|bottom|left))?|gap|row-gap|column-gap|scroll-padding(?:-(?:block|inline))?|scroll-margin(?:-(?:block|inline))?)\s*:\s*([^;{}]+)/g;

const HARDCODED = /-?\d+(?:\.\d+)?(?:px|em|rem)\b/;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else if (/\.(astro|css)$/.test(entry.name) && !entry.name.startsWith('_legacy')) {
      out.push(path);
    }
  }
  return out;
}

/** Deterministic spacing contract. Returns errors instead of exiting. */
export async function lintSpacing(root = process.cwd()) {
  const errors = [];
  const files = (await walk(join(root, 'src')))
    .map((path) => relative(root, path))
    .filter((path) => !IGNORED.has(path));

  for (const file of files) {
    const source = await readFile(join(root, file), 'utf8');
    for (const match of source.matchAll(SPACING_DECLARATION)) {
      if (HARDCODED.test(match[2])) {
        errors.push(`${file}: hardcoded spacing in "${match[0].trim()}"`);
      }
    }
  }

  const tokens = [...(await readFile(join(root, 'src/styles/f.css'), 'utf8'))
    .matchAll(/--space-(\d+):\s*(\d+)px/g)]
    .map((match) => ({ name: `--space-${match[1]}`, value: Number(match[2]) }));

  if (tokens.length < 15) {
    errors.push(`src/styles/f.css: expected a full spacing scale, found ${tokens.length} tokens`);
  }
  for (const token of tokens) {
    if (token.value % 4 !== 0) {
      errors.push(`src/styles/f.css: ${token.name} (${token.value}px) is off the 4px base`);
    }
  }
  for (let i = 1; i < tokens.length; i++) {
    if (tokens[i].value <= tokens[i - 1].value) {
      errors.push(`src/styles/f.css: spacing scale is not strictly ascending at ${tokens[i].name}`);
    }
  }

  return { errors, filesChecked: files.length, tokens: tokens.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const report = await lintSpacing();
  if (report.errors.length) {
    console.error('Spacing lint failed:\n');
    for (const error of report.errors) console.error(`  - ${error}`);
    process.exitCode = 1;
  } else {
    console.log(
      `Spacing lint passed: ${report.filesChecked} files, ${report.tokens} tokens on a 4px base.`
    );
  }
}
