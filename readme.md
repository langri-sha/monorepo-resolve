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
until a package manager's lockfile is found, or an error is thrown:

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

## See

- [`find-up`]

[`find-up`]: https://github.com/sindresorhus/find-up
