import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

interface PackageJson {
  readonly name?: string
  readonly description?: string
  readonly dependencies?: Record<string, string>
  readonly devDependencies?: Record<string, string>
}

interface PackageInfo {
  readonly dir: string
  readonly packageJsonPath: string
  readonly readmePath: string
  readonly name: string
  readonly displayName: string
  readonly description?: string
  readonly dependencyNames: ReadonlyArray<string>
  internalDependencies: ReadonlyArray<PackageLink>
  internalDependents: ReadonlyArray<PackageLink>
  readonly hasReadme: boolean
  status: ReadmeStatus
}

interface PackageLink {
  readonly name: string
  readonly displayName: string
  readonly dir: string
  readonly readmePath: string
}

type ReadmeStatus = 'unchanged' | 'created' | 'appended-block' | 'updated-block'

type ReportRow = {
  readonly pkg: PackageInfo
  readonly dependenciesCount: number
  readonly dependentsCount: number
}

const AUTO_START = '<!-- PACKAGE-DOC-MATRIX:START -->'
const AUTO_END = '<!-- PACKAGE-DOC-MATRIX:END -->'
const REPORT_PATH = 'docs/reports/package-doc-matrix.md'

function toPosix(pathValue: string): string {
  return pathValue.replace(/\\/g, '/')
}

function findPackageDirectories(): string[] {
  const output = execSync("rg --files -g 'package.json'", { encoding: 'utf8' })
  const dirs = new Set<string>()

  for (const line of output.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }

    const pkgDir = toPosix(dirname(trimmed) || '.')
    if (pkgDir.includes('/.worktrees/')) {
      continue
    }

    const gitPath = join(pkgDir, '.git')
    const packageJsonPath = join(pkgDir, 'package.json')

    if (existsSync(gitPath) && existsSync(packageJsonPath)) {
      dirs.add(pkgDir)
    }
  }

  return Array.from(dirs).sort()
}

function loadPackageInfo(dir: string): PackageInfo | null {
  const packageJsonPath = join(dir, 'package.json')
  try {
    const parsed: PackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
    const dependencyNames = new Set<string>()
    for (const bucket of [parsed.dependencies ?? {}, parsed.devDependencies ?? {}]) {
      for (const depName of Object.keys(bucket)) {
        dependencyNames.add(depName)
      }
    }

    const readmePath = join(dir, 'README.md')
    return {
      dir,
      packageJsonPath,
      readmePath,
      name: parsed.name ?? dir,
      displayName: parsed.name ?? dir,
      description: parsed.description,
      dependencyNames: Array.from(dependencyNames),
      internalDependencies: [],
      internalDependents: [],
      hasReadme: existsSync(readmePath),
      status: 'unchanged'
    }
  } catch (error) {
    console.warn(`⚠️  Failed to parse ${packageJsonPath}:`, error)
    return null
  }
}

function assignRelationships(packages: PackageInfo[]): void {
  const packagesByName = new Map<string, PackageInfo>()
  for (const pkg of packages) {
    packagesByName.set(pkg.name, pkg)
  }

  const dependentsMap = new Map<string, PackageLink[]>()

  for (const pkg of packages) {
    const deps: PackageLink[] = []
    for (const depName of pkg.dependencyNames) {
      const dep = packagesByName.get(depName)
      if (!dep || dep.name === pkg.name) {
        continue
      }
      const link: PackageLink = {
        name: dep.name,
        displayName: dep.displayName,
        dir: dep.dir,
        readmePath: dep.readmePath
      }
      deps.push(link)
      const currentDependents = dependentsMap.get(dep.name) ?? []
      dependentsMap.set(dep.name, [...currentDependents, {
        name: pkg.name,
        displayName: pkg.displayName,
        dir: pkg.dir,
        readmePath: pkg.readmePath
      }])
    }
    deps.sort((a, b) => a.displayName.localeCompare(b.displayName))
    pkg.internalDependencies = deps
  }

  for (const pkg of packages) {
    const dependents = dependentsMap.get(pkg.name) ?? []
    const deduped = new Map<string, PackageLink>()
    for (const dependent of dependents) {
      deduped.set(dependent.name, dependent)
    }
    pkg.internalDependents = Array.from(deduped.values()).sort((a, b) => a.displayName.localeCompare(b.displayName))
  }
}

function ensureReadme(pkg: PackageInfo, shouldWrite: boolean, timestamp: string): void {
  const existingContent = pkg.hasReadme ? readFileSync(pkg.readmePath, 'utf8') : buildDefaultReadme(pkg)
  const hasAutoBlock = pkg.hasReadme && existingContent.includes(AUTO_START)

  const block = buildAutoBlock(pkg, timestamp)
  const nextContent = insertOrUpdateBlock(existingContent, block)

  if (nextContent === existingContent) {
    pkg.status = 'unchanged'
    return
  }

  if (pkg.hasReadme) {
    pkg.status = hasAutoBlock ? 'updated-block' : 'appended-block'
  } else {
    pkg.status = 'created'
  }

  if (shouldWrite) {
    writeFileSync(pkg.readmePath, nextContent, 'utf8')
  }
}

function buildDefaultReadme(pkg: PackageInfo): string {
  const lines = [
    `# ${pkg.displayName}`,
    '',
    pkg.description ?? `> ${pkg.displayName} (${pkg.dir}) is part of the Devel workspace. Add background details above the autogenerated dependency matrix.`,
    '',
    '---',
    ''
  ]
  return lines.join('\n')
}

function insertOrUpdateBlock(content: string, block: string): string {
  if (content.includes(AUTO_START) && content.includes(AUTO_END)) {
    const updated = content.replace(new RegExp(`${AUTO_START}[\s\S]*?${AUTO_END}`), block)
    return updated
  }

  return `${content.trimEnd()}\n\n${block}\n`
}

function buildAutoBlock(pkg: PackageInfo, timestamp: string): string {
  const dependenciesSection = renderLinkSection('Internal Dependencies', pkg.internalDependencies, pkg.dir)
  const dependentsSection = renderLinkSection('Internal Dependents', pkg.internalDependents, pkg.dir)

  return [
    AUTO_START,
    '> This section is auto-generated by scripts/package-doc-matrix.ts. Do not edit manually.',
    dependenciesSection,
    dependentsSection,
    `_Last updated: ${timestamp}_`,
    AUTO_END
  ].join('\n\n')
}

function renderLinkSection(title: string, links: ReadonlyArray<PackageLink>, baseDir: string): string {
  if (links.length === 0) {
    return `## ${title}\n\n_None (external-only)._`
  }

  const bullets = links.map((link) => {
    const relativePath = toPosix(relative(baseDir, link.readmePath) || 'README.md')
    return `- [${link.displayName}](${relativePath}) — \`${link.dir}\``
  })

  return `## ${title}\n\n${bullets.join('\n')}`
}

function buildReport(packages: PackageInfo[], timestamp: string): string {
  const rows: ReportRow[] = packages.map((pkg) => ({
    pkg,
    dependenciesCount: pkg.internalDependencies.length,
    dependentsCount: pkg.internalDependents.length
  }))

  const created = packages.filter((pkg) => pkg.status === 'created')
  const updated = packages.filter((pkg) => pkg.status === 'appended-block' || pkg.status === 'updated-block')
  const unchanged = packages.length - created.length - updated.length

  const header = [
    '# Package Documentation Matrix',
    '',
    `_Last updated: ${timestamp}_`,
    '',
    `- Total packages scanned: ${packages.length}`,
    `- READMEs created: ${created.length}`,
    `- READMEs updated with dependency blocks: ${updated.length}`,
    `- Already compliant: ${unchanged}`,
    '',
    'Run `bun run scripts/package-doc-matrix.ts --write` after changing dependencies to refresh this report.'
  ].join('\n')

  const tableHeader = ['| Package | README | Internal Dependencies | Internal Dependents | README Status |', '| --- | --- | --- | --- | --- |']

  const tableRows = rows
    .sort((a, b) => a.pkg.displayName.localeCompare(b.pkg.displayName))
    .map(({ pkg, dependenciesCount, dependentsCount }) => {
      const relativePath = toPosix(relative(dirname(REPORT_PATH), pkg.readmePath))
      const readmeLink = `[${pkg.dir}](${relativePath})`
      const statusMap: Record<ReadmeStatus, string> = {
        created: 'created',
        'appended-block': 'appended block',
        'updated-block': 'updated block',
        unchanged: 'unchanged'
      }
      return `| ${pkg.displayName} | ${readmeLink} | ${dependenciesCount} | ${dependentsCount} | ${statusMap[pkg.status]} |`
    })

  return [header, '', ...tableHeader, ...tableRows, ''].join('\n')
}

function writeReport(content: string): void {
  const dirName = dirname(REPORT_PATH)
  mkdirSync(dirName, { recursive: true })
  writeFileSync(REPORT_PATH, `${content.trim()}\n`, 'utf8')
}

function main(): void {
  const shouldWrite = process.argv.includes('--write')
  const timestamp = new Date().toISOString()
  const packageDirs = findPackageDirectories()
  const packages: PackageInfo[] = []

  for (const dir of packageDirs) {
    const info = loadPackageInfo(dir)
    if (info) {
      packages.push(info)
    }
  }

  assignRelationships(packages)

  for (const pkg of packages) {
    ensureReadme(pkg, shouldWrite, timestamp)
  }

  const report = buildReport(packages, timestamp)
  if (shouldWrite) {
    writeReport(report)
  } else {
    console.log(report)
  }
}

main()
