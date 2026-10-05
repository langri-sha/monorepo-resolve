import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import {
  afterEach,
  describe,
  expect,
  temporaryDirectory,
  test,
  vi,
} from '@langri-sha/vitest'

import { type Context, context, resolve, resolveAsync } from './index'

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

const workingDirectory: Context = { resolve, resolveAsync }

test('resolves synchronously and asynchronously', async () => {
  const root = fixture({ 'pnpm-lock.yaml': '' })

  expect(resolve()).toBe(root)
  await expect(resolveAsync()).resolves.toBe(root)
})

describe.each(['resolve', 'resolveAsync'] as const)('%s', (method) => {
  const lookup = async (
    target: Context,
    ...pathSegments: string[]
  ): Promise<string> => target[method](...pathSegments)

  test.each([
    'bun.lock',
    'bun.lockb',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
  ])('finds the root by %s', async (lockfile) => {
    const root = fixture({ [lockfile]: '' })

    expect(await lookup(workingDirectory)).toBe(root)
  })

  test('resolves paths against the root', async () => {
    const root = fixture({ 'pnpm-lock.yaml': '' })

    expect(await lookup(workingDirectory, 'build', 'app')).toBe(
      path.join(root, 'build', 'app'),
    )
  })

  test('honors MONOREPO_ROOT', async () => {
    fixture({ 'pnpm-lock.yaml': '' })
    const envRoot = temporaryDirectory()
    vi.stubEnv('MONOREPO_ROOT', envRoot)

    expect(await lookup(workingDirectory)).toBe(envRoot)
    expect(await lookup(workingDirectory, 'build')).toBe(
      path.join(envRoot, 'build'),
    )
  })

  test('ignores an empty MONOREPO_ROOT', async () => {
    const root = fixture({ 'pnpm-lock.yaml': '' })
    vi.stubEnv('MONOREPO_ROOT', '')

    expect(await lookup(workingDirectory)).toBe(root)
  })

  test('caches the root per start directory', async () => {
    const root = fixture({ 'pnpm-lock.yaml': '' })

    expect(await lookup(workingDirectory)).toBe(root)

    writeFileSync(path.join(root, 'packages', 'app', 'yarn.lock'), '')

    expect(await lookup(workingDirectory)).toBe(root)
  })

  test('anchors a context on an explicit cwd', async () => {
    const root = fixture({ 'pnpm-lock.yaml': '', 'tools/yarn.lock': '' })
    const tools = path.join(root, 'tools')
    const local = context({ cwd: tools })

    expect(await lookup(local)).toBe(tools)
    expect(await lookup(local, 'build')).toBe(path.join(tools, 'build'))
    expect(await lookup(context({ cwd: '../../tools' }))).toBe(tools)
    expect(await lookup(workingDirectory)).toBe(root)
  })

  test('a context honors MONOREPO_ROOT', async () => {
    const root = fixture({ 'pnpm-lock.yaml': '' })
    const local = context({ cwd: root })
    const envRoot = temporaryDirectory()
    vi.stubEnv('MONOREPO_ROOT', envRoot)

    expect(await lookup(local, 'build')).toBe(path.join(envRoot, 'build'))
  })

  test('fails when no root is found', async () => {
    const root = fixture()

    await expect(lookup(workingDirectory)).rejects.toThrow(
      expect.objectContaining({ code: 'ERR_MONOREPO_ROOT_NOT_FOUND' }),
    )
    await expect(lookup(workingDirectory)).rejects.toThrow(
      `from ${path.join(root, 'packages', 'app')}:`,
    )
    await expect(lookup(workingDirectory)).rejects.toThrow(
      'no lockfile (bun.lock, bun.lockb, package-lock.json, pnpm-lock.yaml, yarn.lock)',
    )
  })
})
