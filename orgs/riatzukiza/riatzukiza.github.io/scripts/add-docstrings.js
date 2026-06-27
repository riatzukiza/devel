#!/usr/bin/env node
/**
 * Script to add docstrings to Sibilant definitions that don't have them
 */

const fs = require('fs');
const path = require('path');

// Docstring templates based on definition type
const docTemplates = {
  define: (name, parent) => {
    if (parent === 'Interface') {
      return `Defines an interface for ${name}`;
    } else if (parent === 'Component') {
      return `Component representing ${name}`;
    } else if (parent === 'System') {
      return `System for managing ${name}`;
    } else if (parent === 'Data-type' || parent === 'Struct' || parent === 'Spawnable') {
      return `Data type representing ${name}`;
    }
    return `Defines ${name}`;
  },

  'def-generic': (name, parent) => {
    if (parent) {
      return `Generic method for ${name} (extends ${parent})`;
    }
    return `Generic method for ${name}`;
  },

  'def-function': (name) => {
    return `Helper function for ${name}`;
  },

  'def-lit-macro': (name) => {
    return `Macro for ${name}`;
  }
};

function generateDocString(line, match, fileContent, lineNum) {
  const type = match[1]; // 'define', 'def-generic', etc.
  const name = match[2]; // Function name
  const parent = match[3]; // Parent type (optional)

  const template = docTemplates[type] || (() => `Defines ${name}`);
  const description = template(name, parent);

  // Generate docstring based on namespace from file
  const namespace = extractNamespace(fileContent);
  const fullPath = namespace ? `${namespace}.${name}` : name;

  const docString = `(doc-string "${fullPath}"\n                "${description}")`;

  return docString;
}

function extractNamespace(content) {
  const match = content.match(/^\(namespace\s+(\S+)/);
  return match ? match[1] : null;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const modified = [];
  let changes = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const originalLine = lines[i]; // Preserve original indentation

    // Match definitions
    const defineMatch = line.match(/^\(define\s+(\S+)\s+(\S+)/);
    const defGenericMatch = line.match(/^\(def-generic\s+(\S+)(?:\s+\(([^)]+)\))?/);
    const defLitMatch = line.match(/^\(def-lit-macro\s+(\S+)/);
    const defFunctionMatch = line.match(/^\(def-function\s+(\S+)/);

    const match = defineMatch || defGenericMatch || defLitMatch || defFunctionMatch;

    if (match) {
      // Look ahead to check if doc-string already exists
      let hasDocString = false;
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine.startsWith('(doc-string')) {
          hasDocString = true;
          break;
        } else if (nextLine && !nextLine.startsWith(';') && !nextLine.startsWith(';;') && !nextLine.startsWith('(')) {
          // If we hit actual code (non-comment, non-empty), assume no docstring
          break;
        } else if (nextLine.startsWith('(def') || nextLine.startsWith('(def-generic')) {
          // New definition without docstring
          break;
        }
      }

      if (!hasDocString) {
        const type = defineMatch ? 'define' :
                      defGenericMatch ? 'def-generic' :
                      defLitMatch ? 'def-lit-macro' : 'def-function';
        const name = match[1];
        const parent = defGenericMatch && defGenericMatch[2] ? defGenericMatch[2].replace(/\s+/g, ' ') : null;

        // Generate docstring
        const docString = generateDocString(line, [type, name, parent], content, i);

        // Add docstring with proper indentation
        const indent = originalLine.match(/^(\s*)/)[1];
        const indentedDocString = docString.split('\n').map(l => indent + l).join('\n');

        modified.push(originalLine);
        modified.push(indentedDocString);
        modified.push('');
        changes++;
        continue;
      }
    }

    modified.push(originalLine);
  }

  if (changes > 0) {
    const newContent = modified.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf8');
    return changes;
  }

  return 0;
}

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

// Main execution
const args = process.argv.slice(2);
let targetDir = path.join(process.cwd(), 'src');

if (args.length > 0) {
  if (args[0] === '--help' || args[0] === '-h') {
    console.log(`
Usage: node add-docstrings.js [options] [path]

Options:
  --help, -h    Show this help
  --list         List files that need updates (don't modify)
  path          Path to Sibilant files (default: ./src)

Examples:
  node add-docstrings.js                    # Add docstrings to all files in src/
  node add-docstrings.js --list           # List files needing updates
  node add-docstrings.js src/shared/math  # Add to specific directory
    `);
    process.exit(0);
  }

  if (args[0] === '--list') {
    // Just list files that need updates
    targetDir = args[1] ? path.join(process.cwd(), args[1]) : targetDir;
    const files = findSibilantFiles(targetDir);
    let totalChanges = 0;
    const filesNeedingUpdates = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      let needsUpdate = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const match = line.match(/^\(define\s+(\S+)\s+(\S+)/) ||
                     line.match(/^\(def-generic\s+(\S+)/) ||
                     line.match(/^\(def-lit-macro\s+(\S+)/) ||
                     line.match(/^\(def-function\s+(\S+)/);

        if (match) {
          // Check if doc-string exists
          let hasDocString = false;
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            const nextLine = lines[j].trim();
            if (nextLine.startsWith('(doc-string')) {
              hasDocString = true;
              break;
            } else if (nextLine && !nextLine.startsWith(';') && !nextLine.startsWith(';;') && !nextLine.startsWith('(')) {
              break;
            }
          }
          if (!hasDocString) {
            needsUpdate = true;
            break;
          }
        }
      }

      if (needsUpdate) {
        filesNeedingUpdates.push(file);
        totalChanges++;
      }
    }

    console.log(`\nFiles needing docstrings: ${filesNeedingUpdates.length}`);
    for (const file of filesNeedingUpdates) {
      console.log(`  ${path.relative(process.cwd(), file)}`);
    }
    console.log(`\nTotal files to update: ${filesNeedingUpdates.length}`);
    process.exit(0);
  }

  // Add docstrings to files
  targetDir = path.join(process.cwd(), args[0]);
}

const files = findSibilantFiles(targetDir);
console.log(`Found ${files.length} Sibilant files...\n`);

let totalChanges = 0;
const updatedFiles = [];

for (const file of files) {
  const changes = processFile(file);
  if (changes > 0) {
    updatedFiles.push(path.relative(process.cwd(), file));
    totalChanges += changes;
    console.log(`✓ ${path.relative(process.cwd(), file)} (${changes} docstrings added)`);
  }
}

console.log(`\n===========================================`);
console.log(`Summary:`);
console.log(`  Files updated: ${updatedFiles.length}`);
console.log(`  Docstrings added: ${totalChanges}`);
console.log(`===========================================`);
