#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { env, exit } from 'node:process'

const DEFAULT_NAMESPACE = env.SONAR_NAMESPACE ?? 'octave-commons'
const DEFAULT_HOST = env.SONAR_HOST_URL ?? 'https://sonarcloud.io'
const DEFAULT_ORG = env.SONAR_ORG ?? env.SONAR_ORGANIZATION ?? 'octave-commons'

function parseArgs() {
  const args = new Map()
  for (let i = 2; i < process.argv.length; i += 1) {
    const value = process.argv[i]
    const next = process.argv[i + 1]
    if (!value.startsWith('--')) {
      continue
    }
    const key = value.slice(2)
    if (next && !next.startsWith('--')) {
      args.set(key, next)
      i += 1
    } else {
      args.set(key, 'true')
    }
  }
  return args
}

function parseGitmodules(text) {
  const lines = text.split(/\r?\n/)
  const entries = []
  let currentPath = null

  for (const raw of lines) {
    const line = raw.trim()
    const moduleMatch = line.match(/^\[submodule "(.+)"\]/)
    if (moduleMatch) {
      if (currentPath) {
        entries.push(currentPath)
      }
      currentPath = null
      continue
    }
    const pathMatch = line.match(/^path\s*=\s*(.+)$/)
    if (pathMatch) {
      currentPath = pathMatch[1].trim()
    }
  }

  if (currentPath) {
    entries.push(currentPath)
  }

  return Array.from(new Set(entries.filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

function toPosix(pathValue) {
  return pathValue.replace(/\\/g, '/')
}

async function collectSubmodulePaths(gitmodulesPath, recursive) {
  const gitmodulesContent = await readFile(gitmodulesPath, 'utf8')
  const basePaths = parseGitmodules(gitmodulesContent).map(toPosix)
  if (!recursive) {
    return Array.from(new Set(basePaths)).sort((a, b) => a.localeCompare(b))
  }

  const allPaths = new Set(basePaths)
  const queue = [...basePaths]

  while (queue.length > 0) {
    const pathValue = queue.shift()
    const nestedPath = toPosix(join(pathValue, '.gitmodules'))
    try {
      const nestedContent = await readFile(nestedPath, 'utf8')
      const nestedEntries = parseGitmodules(nestedContent).map((entry) => toPosix(join(pathValue, entry)))
      for (const entry of nestedEntries) {
        if (!allPaths.has(entry)) {
          allPaths.add(entry)
          queue.push(entry)
        }
      }
    } catch {
      // ignore missing nested .gitmodules
    }
  }

  return Array.from(allPaths).sort((a, b) => a.localeCompare(b))
}

function slugify(pathValue) {
  const normalized = pathValue.replace(/^\.\//, '')
  const slug = normalized.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase()
  return slug.length > 0 ? slug : 'repo'
}

function buildProjects(paths, namespace) {
  return paths.map((pathValue) => {
    const slug = slugify(pathValue)
    return {
      path: pathValue,
      projectKey: `${namespace}-${slug}`,
      projectName: pathValue
    }
  })
}

function buildAuthHeader(token) {
  const encoded = Buffer.from(`${token}:`, 'utf8').toString('base64')
  return { Authorization: `Basic ${encoded}` }
}

async function projectExists(host, token, projectKey, org) {
  const url = new URL('/api/projects/search', host)
  url.searchParams.set('projects', projectKey)
  if (org) {
    url.searchParams.set('organization', org)
  }
  const response = await fetch(url, {
    headers: buildAuthHeader(token)
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to query projects: ${response.status} ${response.statusText} ${body}`)
  }
  const data = await response.json()
  return Array.isArray(data.components) && data.components.length > 0
}

async function createProject(host, token, projectKey, projectName, org) {
  const url = new URL('/api/projects/create', host)
  const params = new URLSearchParams()
  params.set('project', projectKey)
  params.set('name', projectName)
  if (org) {
    params.set('organization', org)
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...buildAuthHeader(token),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to create project ${projectKey}: ${response.status} ${response.statusText} ${body}`)
  }
}

async function ensureProjects(host, token, org, projects, dryRun) {
  for (const project of projects) {
    const exists = await projectExists(host, token, project.projectKey, org)
    if (exists) {
      console.log(`✓ ${project.projectKey} already exists`)
      continue
    }
    if (dryRun) {
      console.log(`DRY-RUN create: ${project.projectKey} (${project.projectName})`)
      continue
    }
    await createProject(host, token, project.projectKey, project.projectName, org)
    console.log(`+ created ${project.projectKey}`)
  }
}

function printMatrix(projects) {
  const matrix = projects.map((project) => ({
    path: project.path,
    projectKey: project.projectKey,
    projectName: project.projectName
  }))
  process.stdout.write(JSON.stringify(matrix))
}

async function main() {
  const args = parseArgs()
  const mode = args.get('mode') ?? (process.argv[2]?.startsWith('--') ? 'ensure' : process.argv[2]) ?? 'ensure'
  const namespace = args.get('namespace') ?? DEFAULT_NAMESPACE
  const host = args.get('host') ?? DEFAULT_HOST
  const org = args.get('org') ?? args.get('organization') ?? DEFAULT_ORG
  const dryRun = args.get('dry-run') === 'true'
  const recursiveFlag = args.get('recursive') ?? 'false'
  const recursive = ['true', '1', 'yes'].includes(recursiveFlag.toLowerCase())

  const gitmodulesPath = args.get('gitmodules') ?? '.gitmodules'
  const rawPaths = await collectSubmodulePaths(gitmodulesPath, recursive)
  const paths = rawPaths.filter((pathValue) => pathValue.startsWith('orgs/'))
  const projects = buildProjects(paths, namespace)

  if (mode === 'matrix') {
    printMatrix(projects)
    return
  }

  if (host.includes('sonarcloud.io') && !org) {
    console.error('SONAR_ORG/SONAR_ORGANIZATION is required when using SonarCloud')
    exit(1)
  }

  const token = env.SONAR_TOKEN ?? ''
  if (!token) {
    console.error('SONAR_TOKEN is required for ensure mode')
    exit(1)
  }

  await ensureProjects(host, token, org, projects, dryRun)
}

main().catch((error) => {
  console.error(error)
  exit(1)
})
