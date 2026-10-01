import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import {
  afterEach,
  beforeEach,
  expect,
  temporaryDirectory,
  test,
  vi,
} from '@langri-sha/vitest'

import monorepo from './index'

beforeEach(() => {
  monorepo.root = undefined
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('root points to the monorepo root correctly', () => {
  expect(monorepo.root).toBe(path.resolve(__dirname, '..'))
})

test('root can be updated correctly', () => {
  const newRoot = temporaryDirectory()
  monorepo.root = newRoot

  expect(monorepo.root).toBe(newRoot)

  monorepo.root = undefined
  expect(monorepo.root).toBe(path.resolve(__dirname, '..'))
})

test('resolves the monorepo root correctly', () => {
  expect(monorepo.resolve()).toBe(path.resolve(__dirname, '..'))
})

test.each(['bun.lock', 'bun.lockb'])('finds the root by %s', (lockfile) => {
  const root = temporaryDirectory()
  const cwd = path.join(root, 'packages', 'app')

  mkdirSync(cwd, { recursive: true })
  writeFileSync(path.join(root, lockfile), '')
  vi.spyOn(process, 'cwd').mockReturnValue(cwd)

  expect(monorepo.root).toBe(root)
})
