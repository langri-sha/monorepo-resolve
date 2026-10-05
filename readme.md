# monorepo-resolve

A utility package that helps you resolve paths relative to your monorepo root.

Useful when you want packages from your workspaces to read and write from a
common path, even when changing directories in your workspace.

## Usage

Install the package:

```sh
npm install -D monorepo-resolve
```

The root of your repository is resolved synchronously by walking upwards from
the working directory, preferring:

1. the nearest directory with a `pnpm-workspace.yaml`, or a `package.json` that
   declares `workspaces`;
2. otherwise, the nearest directory with a lockfile (`bun.lock`, `bun.lockb`,
   `package-lock.json`, `pnpm-lock.yaml` or `yarn.lock`), which covers
   single-package repositories.

The walk stops at the first directory holding `.git`, so it never leaves the
repository, and an error is thrown if neither is found:

```js
// /workspaces/acme-monorepo/packages/myapp/index.js
import monorepo from 'monorepo-resolve'

monorepo.resolve('build', 'myapp') === '/workspaces/acme-monorepo/build/myapp'
```

If you need to switch the root, for example during tests, you can manually
configure the resolved root:

```js
monorepo.root = temporaryDirectory()

// ...elsewhere in your codebase
monorepo.resolve('build', 'myapp') === '/tmp/aa11bb22/build/myapp'
```
