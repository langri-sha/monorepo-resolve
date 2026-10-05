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

const fixture = (files: Record<string, string> = {}): string => {
  const root = temporaryDirectory()
  const cwd = path.join(root, 'packages', 'app')

  mkdirSync(cwd, { recursive: true })

  for (const [file, contents] of Object.entries(files)) {
    const target = path.join(root, file)

    if (file.endsWith('/')) {
      mkdirSync(target, { recursive: true })
    } else {
      mkdirSync(path.dirname(target), { recursive: true })
      writeFileSync(target, contents)
    }
  }

  vi.spyOn(process, 'cwd').mockReturnValue(cwd)

  return root
}

beforeEach(() => {
  monorepo.root = undefined
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

test.each([
  'bun.lock',
  'bun.lockb',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
])('finds the root by %s', (lockfile) => {
  const root = fixture({ [lockfile]: '' })

  expect(monorepo.root).toBe(root)
})

test('resolves paths against the root', () => {
  const root = fixture({ 'pnpm-lock.yaml': '' })

  expect(monorepo.resolve()).toBe(root)
  expect(monorepo.resolve('build', 'app')).toBe(path.join(root, 'build', 'app'))
})

test('root can be updated correctly', () => {
  const root = fixture({ 'pnpm-lock.yaml': '' })
  const newRoot = temporaryDirectory()
  monorepo.root = newRoot

  expect(monorepo.root).toBe(newRoot)

  monorepo.root = undefined
  expect(monorepo.root).toBe(root)
})

test('resolves against the configured root', () => {
  fixture({ 'pnpm-lock.yaml': '' })
  const newRoot = temporaryDirectory()
  monorepo.root = newRoot

  expect(monorepo.resolve('build', 'app')).toBe(
    path.join(newRoot, 'build', 'app'),
  )
})

test('honors MONOREPO_ROOT', () => {
  fixture({ 'pnpm-lock.yaml': '' })
  const envRoot = temporaryDirectory()
  vi.stubEnv('MONOREPO_ROOT', envRoot)

  expect(monorepo.root).toBe(envRoot)
  expect(monorepo.resolve('build')).toBe(path.join(envRoot, 'build'))
})

test('prefers the configured root over MONOREPO_ROOT', () => {
  fixture({ 'pnpm-lock.yaml': '' })
  const newRoot = temporaryDirectory()
  vi.stubEnv('MONOREPO_ROOT', temporaryDirectory())
  monorepo.root = newRoot

  expect(monorepo.root).toBe(newRoot)
})

test('ignores an empty MONOREPO_ROOT', () => {
  const root = fixture({ 'pnpm-lock.yaml': '' })
  vi.stubEnv('MONOREPO_ROOT', '')

  expect(monorepo.root).toBe(root)
})

test('throws when no root is found', () => {
  fixture()

  expect(() => monorepo.root).toThrow(
    'Could not resolve the root directory of the monorepo',
  )
  expect(() => monorepo.resolve()).toThrow(
    'Could not resolve the root directory of the monorepo',
  )
})
