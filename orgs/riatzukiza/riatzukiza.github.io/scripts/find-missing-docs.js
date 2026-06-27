#!/usr/bin/env node
/**
 * Script to find Sibilant definitions missing docstrings
 */

const fs = require('fs');
const path = require('path');

function findSibilantFiles(dir, extensions = ['.sibilant']) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...findSibilantFiles(fullPath, extensions));
    } else if (extensions.some(ext => item.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

function checkFileForMissingDocs(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const results = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Match definitions: (define, (def-generic, (def-lit-macro, (def-function
    const defineMatch = line.match(/^\(define\s+(\S+)\s+(\S+)/);
    const defGenericMatch = line.match(/^\(def-generic\s+(\S+)/);
    const defLitMatch = line.match(/^\(def-lit-macro\s+(\S+)/);
    const defFunctionMatch = line.match(/^\(def-function\s+(\S+)/);

    const match = defineMatch || defGenericMatch || defLitMatch || defFunctionMatch;

    if (match) {
      const type = defineMatch ? 'define' :
                  defGenericMatch ? 'def-generic' :
                  defLitMatch ? 'def-lit-macro' : 'def-function';
      const name = match[1];
      const parent = match[2];

      // Look ahead for doc-string
      let hasDocString = false;
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine.startsWith('(doc-string')) {
          hasDocString = true;
          break;
        } else if (nextLine && !nextLine.startsWith(';') && !nextLine.startsWith(';;')) {
          // If we hit actual code, assume no docstring
          break;
        }
      }

      if (!hasDocString) {
        const relPath = path.relative(process.cwd(), filePath);
        results.push({
          file: relPath,
          line: i + 1,
          type,
          name,
          parent,
          code: line
        });
      }
    }
  }

  return results;
}

// Main execution
const srcDir = path.join(process.cwd(), 'src');
const files = findSibilantFiles(srcDir);

const missingDocs = [];
for (const file of files) {
  const results = checkFileForMissingDocs(file);
  missingDocs.push(...results);
}

// Group by file for easier reading
const byFile = {};
for (const item of missingDocs) {
  if (!byFile[item.file]) {
    byFile[item.file] = [];
  }
  byFile[item.file].push(item);
}

// Output results
console.log(`\nFound ${missingDocs.length} definitions missing docstrings:\n`);

for (const [file, items] of Object.entries(byFile)) {
  console.log(`\n${file} (${items.length} missing):`);
  for (const item of items) {
    console.log(`  Line ${item.line}: ${item.type} ${item.name} ${item.parent ? `(${item.parent})` : ''}`);
    console.log(`    ${item.code}`);
  }
}

console.log(`\nTotal files affected: ${Object.keys(byFile).length}`);
console.log(`Total definitions missing docs: ${missingDocs.length}`);
