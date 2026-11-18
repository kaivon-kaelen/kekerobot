// Génère CHANGELOG.json à partir de l'historique Git.
// Ce fichier est ensuite embarqué dans l'image Docker par la CI.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'CHANGELOG.json');

function git(args) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
}

const version = (
  process.env.GITHUB_SHA ||
  git(['rev-parse', 'HEAD']).trim()
);

// %x1f = séparateur de champs, %x1e = séparateur de commits
const raw = git(['log', '--reverse', '--pretty=format:%H%x1f%an%x1f%aI%x1f%B%x1e']);

const commits = raw
  .split('\x1e')
  .map((block) => block.trim())
  .filter(Boolean)
  .map((block) => {
    const [sha, author, date, ...messageParts] = block.split('\x1f');
    return {
      sha,
      author,
      date,
      message: messageParts.join('\x1f').trim(),
    };
  });

const changelog = {
  version,
  generatedAt: new Date().toISOString(),
  count: commits.length,
  commits,
};

fs.writeFileSync(OUTPUT, JSON.stringify(changelog, null, 2), 'utf8');
console.log(`[changelog] ${commits.length} commit(s) écrits dans CHANGELOG.json (version ${version}).`);
