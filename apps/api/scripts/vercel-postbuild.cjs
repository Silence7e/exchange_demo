const { cpSync, mkdirSync, rmSync } = require('fs');
const { join } = require('path');

const apiRoot = join(__dirname, '..');
const repoRoot = join(apiRoot, '../..');
const target = join(apiRoot, 'node_modules/@exchange/shared');

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(join(repoRoot, 'packages/shared/package.json'), join(target, 'package.json'));
cpSync(join(repoRoot, 'packages/shared/dist'), join(target, 'dist'), { recursive: true });
