import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import {
  afterEach,
  expect,
  temporaryDirectory,
  test,
  vi,
} from '@langri-sha/vitest'

import { context, resolve } from './index'

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

  expect(resolve()).toBe(root)
})

test('resolves paths against the root', () => {
  const root = fixture({ 'pnpm-lock.yaml': '' })

  expect(resolve('build', 'app')).toBe(path.join(root, 'build', 'app'))
})

test('honors MONOREPO_ROOT', () => {
  fixture({ 'pnpm-lock.yaml': '' })
  const envRoot = temporaryDirectory()
  vi.stubEnv('MONOREPO_ROOT', envRoot)

  expect(resolve()).toBe(envRoot)
  expect(resolve('build')).toBe(path.join(envRoot, 'build'))
})

test('ignores an empty MONOREPO_ROOT', () => {
  const root = fixture({ 'pnpm-lock.yaml': '' })
  vi.stubEnv('MONOREPO_ROOT', '')

  expect(resolve()).toBe(root)
})

test('caches the root per start directory', () => {
  const root = fixture({ 'pnpm-lock.yaml': '' })

  expect(resolve()).toBe(root)

  writeFileSync(path.join(root, 'packages', 'app', 'yarn.lock'), '')

  expect(resolve()).toBe(root)
})

test('anchors a context on an explicit cwd', () => {
  const root = fixture({ 'pnpm-lock.yaml': '', 'tools/yarn.lock': '' })
  const tools = path.join(root, 'tools')
  const local = context({ cwd: tools })

  expect(local.resolve()).toBe(tools)
  expect(local.resolve('build')).toBe(path.join(tools, 'build'))
  expect(context({ cwd: '../../tools' }).resolve()).toBe(tools)
  expect(resolve()).toBe(root)
})

test('a context honors MONOREPO_ROOT', () => {
  const root = fixture({ 'pnpm-lock.yaml': '' })
  const local = context({ cwd: root })
  const envRoot = temporaryDirectory()
  vi.stubEnv('MONOREPO_ROOT', envRoot)

  expect(local.resolve('build')).toBe(path.join(envRoot, 'build'))
})

test('throws when no root is found', () => {
  const root = fixture()

  expect(() => resolve()).toThrow(
    expect.objectContaining({ code: 'ERR_MONOREPO_ROOT_NOT_FOUND' }),
  )
  expect(() => resolve()).toThrow(`from ${path.join(root, 'packages', 'app')}:`)
  expect(() => resolve()).toThrow(
    'no lockfile (bun.lock, bun.lockb, package-lock.json, pnpm-lock.yaml, yarn.lock)',
  )
})
