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
   * The monorepo root directory: the configured root, else `MONOREPO_ROOT`,
   * else the nearest directory with a package manager's lockfile, looking
   * upwards from the context's `cwd`.
   */
  readonly root: string

  /**
   * Resolves paths relative to the monorepo root directory.
   */
  resolve: (...pathSegments: string[]) => string
}

let root: string | undefined

const roots = new Map<string, string>()

/**
 * Creates a context anchored on `cwd`. Lookups are synchronous, throw if the
 * root cannot be resolved, and cache detected roots per start directory.
 */
const context = ({ cwd }: ContextOptions = {}): Context => {
  const start = cwd === undefined ? undefined : path.resolve(cwd)

  const getRoot = (): string =>
    root || process.env.MONOREPO_ROOT || detectRoot(start ?? process.cwd())

  return {
    get root() {
      return getRoot()
    },

    resolve: (...pathSegments) => path.resolve(getRoot(), ...pathSegments),
  }
}

const detectRoot = (start: string): string => {
  let detected = roots.get(start)

  if (!detected) {
    const result = findUpSync(
      [
        'bun.lock',
        'bun.lockb',
        'package-lock.json',
        'pnpm-lock.yaml',
        'yarn.lock',
      ],
      { cwd: start },
    )

    if (!result) {
      throw new Error(
        'Could not resolve the root directory of the monorepo. Make sure you have a lockfile generated first.',
      )
    }

    detected = path.dirname(result)
    roots.set(start, detected)
  }

  return detected
}

const workingDirectory = context()

export default {
  resolve: workingDirectory.resolve,

  context,

  get root(): string {
    return workingDirectory.root
  },

  set root(newRoot: string | undefined) {
    root = newRoot
  },
}
