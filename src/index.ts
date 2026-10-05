import { statSync } from 'node:fs'
import path from 'node:path'

let root: string | undefined

export default {
  /**
   * Resolves paths relative to the monorepo root directory, which is resolved by
   * looking upwards for package manager lockfiles.
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
  for (let directory = process.cwd(); ; directory = path.dirname(directory)) {
    if (lockfiles.some((file) => isFile(path.join(directory, file)))) {
      return directory
    }

    if (directory === path.dirname(directory)) {
      throw new Error(
        'Could not resolve the root directory of the monorepo. Make sure you have a lockfile generated first.',
      )
    }
  }
}

const isFile = (file: string): boolean =>
  statSync(file, { throwIfNoEntry: false })?.isFile() ?? false
