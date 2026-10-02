import { Project, TypeScriptConfig } from '@langri-sha/projen-project'

const project = new Project({
  name: 'monorepo-resolve',
  package: {
    authorEmail: 'filip.dupanovic@gmail.com',
    authorName: 'Filip Dupanović',
    authorOrganization: false,
    authorUrl: 'https://langri-sha.com',
    bugsUrl: 'https://github.com/langri-sha/monorepo-resolve/issues',
    copyrightYear: '2024',
    description: 'Resolve paths relative to the root of a monorepo',
    homepage: 'https://github.com/langri-sha/monorepo-resolve#readme',
    keywords: ['lockfile', 'monorepo', 'path', 'root', 'workspace'],
    license: 'MIT',
    licensed: true,
    minNodeVersion: '24.16.0',
    repository: 'git+https://github.com/langri-sha/monorepo-resolve.git',
    type: 'module',

    deps: ['find-up@8.0.0'],
    devDeps: [
      '@langri-sha/eslint-config@0.9.16',
      '@langri-sha/lint-staged@0.9.7',
      '@langri-sha/prettier@0.4.8',
      '@langri-sha/projen-project@*',
      '@langri-sha/tsconfig@1.0.1',
      '@langri-sha/vitest@0.2.0',
      '@types/node@24.19.0',
      'vitest@5.0.2',
    ],
  },
  beachball: {
    config: {
      // The package is the repository root, so these would otherwise demand a
      // release for changes that never reach the tarball.
      ignorePatterns: [
        '.editorconfig',
        '.gitattributes',
        '.gitignore',
        '.prettierignore',
        '.projenrc.ts',
        'AGENTS.md',
        'CODEOWNERS',
        'beachball.config.cjs',
        'eslint.config.js',
        'lint-staged.config.js',
        'pnpm-lock.yaml',
        'pnpm-workspace.yaml',
        'prettier.config.js',
        'renovate.json5',
        'tsconfig.json',
      ],
    },
  },
  codeowners: {
    '*': '@langri-sha',
  },
  editorConfig: {},
  eslint: {},
  husky: {
    'pre-commit': 'lint-staged',
  },
  lintStaged: {},
  lintSynthesized: {},
  npmIgnore: {
    ignorePatterns: [
      '*.test.*',
      '__snapshots__/',
      '/*.config.*',
      '/*.json5',
      '/*.yaml',
      '/AGENTS.md',
      '/CODEOWNERS',
      '/change/',
    ],
  },
  pnpmWorkspace: {
    minimumReleaseAgeExclude: ['@langri-sha/*'],
  },
  prettier: {},
  readme: {
    filename: 'readme.md',
  },
  renovate: {
    packageRules: [
      {
        description: 'Update our own packages together',
        groupName: 'langri-sha projen toolchain',
        groupSlug: 'langri-sha-projen',
        matchPackageNames: ['@langri-sha/**'],
      },
      {
        description: 'Install our own packages without waiting them out',
        matchPackageNames: ['@langri-sha/**'],
        minimumReleaseAge: null,
      },
      {
        description:
          'Install our own GitHub Actions and Terraform modules without waiting them out',
        matchPackageNames: ['langri-sha/**'],
        minimumReleaseAge: null,
      },
    ],
  },
  typeScriptConfig: {
    config: {
      compilerOptions: {
        noEmit: true,
      },
      include: ['src'],
    },
  },
})

project.package?.addField('packageManager', 'pnpm@12.8.1')
project.package?.addField('publishConfig', {
  access: 'public',
  main: 'dist/index.js',
  types: 'dist/index.d.ts',
})

// Published from the root, so `engines` would bind every consumer to the Node.js
// release this repository is developed on. `actions/setup-node` reads the same
// version from `devEngines`, which the registry leaves to the maintainers.
project.package?.file.addDeletionOverride('engines')
project.package?.addField('devEngines', {
  runtime: {
    name: 'node',
    version: `>= ${project.package.minNodeVersion}`,
  },
})

project.package?.setScript(
  'prepublishOnly',
  'rm -rf dist; tsc --project tsconfig.build.json',
)
project.package?.setScript('test', 'vitest')

new TypeScriptConfig(project, {
  fileName: 'tsconfig.build.json',
  config: {
    extends: '@langri-sha/tsconfig/build',
    include: ['src'],
    exclude: ['**/*.test.*'],
  },
})

project.synth()
