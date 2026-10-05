# monorepo-resolve

A utility package that helps you resolve paths relative to your monorepo root.

Useful when you want packages from your workspaces to read and write from a
common path, even when changing directories in your workspace.

## Usage

Install the package:

```sh
npm install -D monorepo-resolve
```

The root of your repository will be synchronously resolved by going upwards
until a package manager's lockfile is found, or an error with the code
`ERR_MONOREPO_ROOT_NOT_FOUND` is thrown:

```js
// /workspaces/acme-monorepo/packages/myapp/index.js
import { resolve } from 'monorepo-resolve'

resolve('build', 'myapp') === '/workspaces/acme-monorepo/build/myapp'
resolve() === '/workspaces/acme-monorepo'
```

`resolveAsync` does the same without blocking on the lookup:

```js
import { resolveAsync } from 'monorepo-resolve'

await resolveAsync('build', 'myapp')
```

From CommonJS, `require('monorepo-resolve')` returns the same named exports.

The detected root is cached per starting directory. To anchor on a module's own
location rather than the working directory, create a context with a `cwd`:

```js
import { context } from 'monorepo-resolve'

const local = context({ cwd: import.meta.dirname })

local.resolve('build', 'myapp')
```

To switch the root, for example during tests, set `MONOREPO_ROOT`. It takes
precedence over detection in every context, is read on each lookup, and reaches
child processes such as Vitest's workers:

```sh
MONOREPO_ROOT=/tmp/aa11bb22 vitest
```

```js
vi.stubEnv('MONOREPO_ROOT', temporaryDirectory())

resolve('build', 'myapp') === '/tmp/aa11bb22/build/myapp'
```

## See

- [`find-up`]

[`find-up`]: https://github.com/sindresorhus/find-up
