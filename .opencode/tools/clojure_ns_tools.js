/**
 * Clojure Namespace Tools for OpenCode
 * 
 * Provides definitive namespace-to-path conversion and auditing to resolve
 * the common confusion between kebab-case namespaces and snake_case file paths.
 */

const fs = require('fs');
const path = require('path');

/**
 * Converts a Clojure namespace to a relative file path (snake_case).
 * 
 * @param {string} ns - Clojure namespace, e.g., "my-app.core-utils"
 * @param {string} ext - File extension, default 'clj'
 * @returns {string} - Relative path, e.g., "my_app/core_utils.clj"
 */
function namespaceToPath(ns, ext = 'clj') {
  if (!ns || typeof ns !== 'string') {
    throw new Error('Namespace must be a non-empty string');
  }
  
  const segments = ns.split('.');
  const pathSegments = segments.map(segment => segment.replace(/-/g, '_'));
  return pathSegments.join('/') + '.' + ext;
}

/**
 * Converts a file path to a Clojure namespace (kebab-case).
 * 
 * @param {string} filePath - Relative path from source root, e.g., "my_app/core_utils.clj"
 * @returns {string} - Clojure namespace, e.g., "my-app.core-utils"
 */
function pathToNamespace(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('File path must be a non-empty string');
  }
  
  const ext = path.extname(filePath);
  const corePath = filePath.slice(0, -ext.length);
  
  // Normalize separators and split
  const parts = corePath.split(path.sep);
  
  // Convert underscores to dashes
  const nsParts = parts.map(part => part.replace(/_/g, '-'));
  return nsParts.join('.');
}

/**
 * Reads and parses the namespace declaration from a Clojure file.
 * 
 * @param {string} filePath - Path to the .clj or .cljs file
 * @returns {{ ns: string | null, error: string | null }}
 */
function readNamespaceDeclaration(filePath) {
  if (!fs.existsSync(filePath)) {
    return { ns: null, error: `File not found: ${filePath}` };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Match (ns ...) at the start of the file (with optional comments before)
  // This regex handles: (ns foo.bar), (ns ^:meta foo.bar), (ns foo.bar (:require ...))
  const nsMatch = content.match(/^\s*\(\s*ns\s+([\w\.\-]+)/m);
  
  if (!nsMatch) {
    return { ns: null, error: 'No (ns ...) declaration found in file' };
  }
  
  return { ns: nsMatch[1], error: null };
}

/**
 * Determines the source root for a given file path.
 * 
 * @param {string} filePath - Absolute or relative file path
 * @param {string[]} sourceRoots - Known source root directories
 * @returns {{ root: string | null, relativePath: string | null }}
 */
function identifySourceRoot(filePath, sourceRoots = ['src', 'test', 'src/main/clojure', 'src/main/cljs']) {
  for (const root of sourceRoots) {
    if (filePath.includes(`/${root}/`) || filePath.startsWith(`${root}/`)) {
      const regex = new RegExp(`/${root}/(.+)`);
      const match = filePath.match(regex);
      if (match) {
        return { root, relativePath: match[1] };
      }
    }
  }
  return { root: null, relativePath: null };
}

/**
 * Audits a Clojure file to verify its namespace declaration matches its location.
 * 
 * @param {string} filePath - Absolute path to the .clj/.cljs file
 * @param {string[]} sourceRoots - Known source root directories to check against
 * @returns {Object} Audit result with status and details
 */
function auditNamespace(filePath, sourceRoots = ['src', 'test', 'src/main/clojure', 'src/main/cljs']) {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return {
      status: 'file_not_found',
      filePath,
      message: `File does not exist: ${filePath}`
    };
  }
  
  // Read the namespace declaration
  const { ns: declaredNs, error: readError } = readNamespaceDeclaration(filePath);
  
  if (readError) {
    return {
      status: 'parse_error',
      filePath,
      message: readError
    };
  }
  
  // Identify which source root this file belongs to
  const { root, relativePath } = identifySourceRoot(filePath, sourceRoots);
  
  if (!root) {
    return {
      status: 'warning',
      filePath,
      declaredNs,
      message: 'File is not inside a known source root. Cannot fully verify mapping.',
      hint: `Known source roots: ${sourceRoots.join(', ')}`
    };
  }
  
  // Calculate what the namespace should be based on file path
  const expectedNsFromPath = pathToNamespace(relativePath);
  
  // Calculate what the path should be based on namespace
  const expectedPathFromNs = namespaceToPath(declaredNs);
  const fullExpectedPath = path.join(root, expectedPathFromNs);
  
  // Check for mismatch
  if (declaredNs === expectedNsFromPath) {
    return {
      status: 'ok',
      filePath,
      declaredNs,
      sourceRoot: root,
      message: 'Namespace declaration matches file path correctly'
    };
  }
  
  // Mismatch detected - provide detailed diagnostics
  return {
    status: 'mismatch',
    filePath,
    declaredNs,
    expectedNsFromPath,
    fullExpectedPath,
    sourceRoot: root,
    issues: {
      filePathMismatch: filePath !== fullExpectedPath,
      nsMismatch: declaredNs !== expectedNsFromPath
    },
    recommendations: generateRecommendations({
      filePath,
      declaredNs,
      expectedNsFromPath,
      fullExpectedPath,
      root
    }),
    message: 'Namespace declaration does not match file path'
  };
}

/**
 * Generates fix recommendations based on the audit result.
 */
function generateRecommendations({ filePath, declaredNs, expectedNsFromPath, fullExpectedPath, root }) {
  const recommendations = [];
  
  // Option 1: Update namespace to match file path
  recommendations.push({
    action: 'update_ns',
    description: `Change (ns ${declaredNs}) to (ns ${expectedNsFromPath}) in the file`,
    command: `sed -i 's/(ns ${declaredNs})/(ns ${expectedNsFromPath})/' ${filePath}`
  });
  
  // Option 2: Move file to expected location
  recommendations.push({
    action: 'move_file',
    description: `Move file to expected location: ${fullExpectedPath}`,
    command: `mv ${filePath} ${fullExpectedPath}`
  });
  
  // Decision guidance
  if (filePath.includes('-') && filePath.split('/').pop()?.includes('-')) {
    recommendations[1].note = 'File name contains dashes - Clojure convention prefers snake_case filenames';
  }
  
  return recommendations;
}

/**
 * Batch audit multiple files.
 */
function auditMultiple(filePaths, sourceRoots) {
  const results = [];
  
  for (const filePath of filePaths) {
    results.push(auditNamespace(filePath, sourceRoots));
  }
  
  // Summarize
  const summary = {
    total: results.length,
    ok: results.filter(r => r.status === 'ok').length,
    mismatch: results.filter(r => r.status === 'mismatch').length,
    warnings: results.filter(r => r.status === 'warning').length,
    errors: results.filter(r => r.status === 'error' || r.status === 'file_not_found').length
  };
  
  return { results, summary };
}

// OpenCode Tool Export Schema
const toolDefinition = {
  name: 'audit_clojure_ns',
  description: 'Audits a Clojure file to verify its namespace declaration matches its file path. Returns detailed diagnostics and fix recommendations.',
  parameters: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Absolute or relative path to the .clj or .cljs file to audit',
        pattern: '.*\\.(clj|cljs)$'
      },
      sourceRoots: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional: list of source root directories to check against',
        default: ['src', 'test', 'src/main/clojure', 'src/main/cljs']
      }
    },
    required: ['filePath']
  },
  returns: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['ok', 'mismatch', 'warning', 'file_not_found', 'parse_error'],
        description: 'Overall audit status'
      },
      filePath: { type: 'string' },
      declaredNs: { type: 'string' },
      expectedNsFromPath: { type: 'string' },
      fullExpectedPath: { type: 'string' },
      message: { type: 'string' },
      recommendations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            action: { type: 'string' },
            description: { type: 'string' },
            command: { type: 'string' }
          }
        }
      }
    }
  }
};

// Main execution for OpenCode tool runner
async function execute(args) {
  try {
    const { filePath, sourceRoots } = args;
    
    if (!filePath) {
      return {
        status: 'error',
        message: 'Missing required parameter: filePath'
      };
    }
    
    const result = auditNamespace(filePath, sourceRoots);
    return result;
    
  } catch (error) {
    return {
      status: 'error',
      message: error.message
    };
  }
}

// Export for both OpenCode and direct Node.js usage
module.exports = {
  namespaceToPath,
  pathToNamespace,
  auditNamespace,
  auditMultiple,
  readNamespaceDeclaration,
  identifySourceRoot,
  toolDefinition,
  execute
};
