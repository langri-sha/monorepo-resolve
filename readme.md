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
```

From CommonJS, `require('monorepo-resolve')` returns the same named exports.

The detected root is cached per starting directory. To anchor on a module's own
location rather than the working directory, create a context with a `cwd`:

```js
import { context } from 'monorepo-resolve'

const local = context({ cwd: import.meta.dirname })

local.resolve('build', 'myapp')
local.root
```

If you need to switch the root, for example during tests, you can manually
configure it on the default export:

```js
import monorepo from 'monorepo-resolve'

monorepo.root = temporaryDirectory()

// ...elsewhere in your codebase
resolve('build', 'myapp') === '/tmp/aa11bb22/build/myapp'
```

The setter only affects the current process. To reach child processes, such as
Vitest's workers, set `MONOREPO_ROOT` instead:

```sh
MONOREPO_ROOT=/tmp/aa11bb22 vitest
```

The setter takes precedence over `MONOREPO_ROOT`, which takes precedence over
detection.

## See

- [`find-up`]

[`find-up`]: https://github.com/sindresorhus/find-up
