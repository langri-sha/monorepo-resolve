import path from 'node:path'

import { findUp, findUpSync } from 'find-up'

export interface ContextOptions {
  /**
   * The directory to look upwards from. Defaults to the working directory at
   * the time of each lookup.
   */
  cwd?: string
}

export interface Context {
  /**
   * Resolves paths relative to the monorepo root directory: `MONOREPO_ROOT`,
   * else the nearest directory with a package manager's lockfile, looking
   * upwards from the context's `cwd`. Without segments, returns the root.
   */
  resolve: (...pathSegments: string[]) => string

  /**
   * Like `resolve`, but looks for the lockfile asynchronously.
   */
  resolveAsync: (...pathSegments: string[]) => Promise<string>
}

const lockfiles = [
  'bun.lock',
  'bun.lockb',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
]

const roots = new Map<string, string>()

/**
 * Creates a context anchored on `cwd`. Lookups fail with
 * `ERR_MONOREPO_ROOT_NOT_FOUND` if the root cannot be resolved, and share a
 * cache of detected roots per start directory.
 */
export const context = ({ cwd }: ContextOptions = {}): Context => {
  const start = cwd === undefined ? undefined : path.resolve(cwd)

  return {
    resolve: (...pathSegments) =>
      path.resolve(
        process.env.MONOREPO_ROOT || detectRoot(start ?? process.cwd()),
        ...pathSegments,
      ),

    resolveAsync: async (...pathSegments) =>
      path.resolve(
        process.env.MONOREPO_ROOT ||
          (await detectRootAsync(start ?? process.cwd())),
        ...pathSegments,
      ),
  }
}

const workingDirectory = context()

/**
 * Resolves paths relative to the monorepo root directory, looking upwards from
 * the working directory.
 */
export const resolve = workingDirectory.resolve

/**
 * Like `resolve`, but looks for the lockfile asynchronously.
 */
export const resolveAsync = workingDirectory.resolveAsync

const detectRoot = (start: string): string =>
  roots.get(start) ?? cacheRoot(start, findUpSync(lockfiles, { cwd: start }))

const detectRootAsync = async (start: string): Promise<string> =>
  roots.get(start) ?? cacheRoot(start, await findUp(lockfiles, { cwd: start }))

const cacheRoot = (start: string, lockfile: string | undefined): string => {
  if (!lockfile) {
    throw Object.assign(
      new Error(
        `Could not find the monorepo root looking upwards from ${start}: no lockfile (${lockfiles.join(', ')}).`,
      ),
      { code: 'ERR_MONOREPO_ROOT_NOT_FOUND' },
    )
  }

  const root = path.dirname(lockfile)
  roots.set(start, root)

  return root
}
