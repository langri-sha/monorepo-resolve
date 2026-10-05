import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

let root: string | undefined

export default {
  /**
   * Resolves paths relative to the monorepo root directory, which is resolved by
   * looking upwards for a workspace definition, or failing that a lockfile.
   *
   * The operation is synchronous and will throw if the root cannot be resolved.
   * @param pathSegments
   * @returns
   */
  resolve: (...pathSegments: string[]): string =>
    path.resolve(getRoot(), ...pathSegments),

  get root(): string {
    return getRoot()
  },

  set root(newRoot: string | undefined) {
    root = newRoot
  },
}

const lockfiles = [
  'bun.lock',
  'bun.lockb',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
]

const getRoot = (): string => root || findRoot()

const findRoot = (): string => {
  let lockfileRoot: string | undefined

  for (let directory = process.cwd(); ; directory = path.dirname(directory)) {
    if (isWorkspaceRoot(directory)) {
      return directory
    }

    if (!lockfileRoot && hasLockfile(directory)) {
      lockfileRoot = directory
    }

    if (
      existsSync(path.join(directory, '.git')) ||
      directory === path.dirname(directory)
    ) {
      break
    }
  }

  if (!lockfileRoot) {
    throw new Error(
      'Could not resolve the root directory of the monorepo. Make sure you have a lockfile generated first.',
    )
  }

  return lockfileRoot
}

const isWorkspaceRoot = (directory: string): boolean =>
  isFile(path.join(directory, 'pnpm-workspace.yaml')) ||
  hasWorkspaces(directory)

const hasWorkspaces = (directory: string): boolean => {
  try {
    const manifest = JSON.parse(
      readFileSync(path.join(directory, 'package.json'), 'utf8'),
    ) as { workspaces?: unknown } | null

    return Boolean(manifest?.workspaces)
  } catch {
    return false
  }
}

const hasLockfile = (directory: string): boolean =>
  lockfiles.some((file) => isFile(path.join(directory, file)))

const isFile = (file: string): boolean =>
  statSync(file, { throwIfNoEntry: false })?.isFile() ?? false
