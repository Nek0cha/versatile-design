#!/usr/bin/env node
// 使い方: node lint-design.mjs <path...>
import { stat } from 'node:fs/promises';
import { lintPaths, formatViolations } from './lib/lint-engine.mjs';

const paths = process.argv.slice(2);
if (paths.length === 0) {
  console.error('使い方: node lint-design.mjs <path...>');
  process.exit(2);
}
for (const p of paths) {
  try {
    await stat(p);
  } catch {
    console.error(`パスが見つかりません: ${p}`);
    process.exit(2);
  }
}
const { violations, filesScanned } = await lintPaths(paths);
if (violations.length === 0) {
  console.log(`違反はありません（${filesScanned} ファイル）`);
  process.exit(0);
}
console.log(formatViolations(violations));
process.exit(1);
