import path from 'node:path'

import { findUpSync } from 'find-up'

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
 * Creates a context anchored on `cwd`. Lookups are synchronous, throw if the
 * root cannot be resolved, and cache detected roots per start directory.
 */
export const context = ({ cwd }: ContextOptions = {}): Context => {
  const start = cwd === undefined ? undefined : path.resolve(cwd)

  return {
    resolve: (...pathSegments) =>
      path.resolve(
        process.env.MONOREPO_ROOT || detectRoot(start ?? process.cwd()),
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

const detectRoot = (start: string): string => {
  let detected = roots.get(start)

  if (!detected) {
    const result = findUpSync(lockfiles, { cwd: start })

    if (!result) {
      throw Object.assign(
        new Error(
          `Could not find the monorepo root looking upwards from ${start}: no lockfile (${lockfiles.join(', ')}).`,
        ),
        { code: 'ERR_MONOREPO_ROOT_NOT_FOUND' },
      )
    }

    detected = path.dirname(result)
    roots.set(start, detected)
  }

  return detected
}
