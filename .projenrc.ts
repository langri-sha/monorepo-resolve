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
    minNodeVersion: '24.22.1',
    repository: 'git+https://github.com/langri-sha/monorepo-resolve.git',
    type: 'module',

    deps: ['find-up@8.0.0'],
    devDeps: [
      '@langri-sha/eslint-config@0.10.0',
      '@langri-sha/lint-staged@0.9.11',
      '@langri-sha/prettier@0.4.11',
      '@langri-sha/projen-project@*',
      '@langri-sha/tsconfig@1.1.1',
      '@langri-sha/vitest@0.2.3',
      '@types/node@24.19.2',
      'vitest@5.0.5',
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
        'dagger.lock',
        'dagger.toml',
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
  claude: {
    settings: {
      attribution: { commit: '', pr: '', sessionUrl: false },
    },
  },
  codeowners: {
    '*': '@langri-sha',
  },
  dagger: {},
  editorConfig: {},
  eslint: {},
  githubTemplates: {},
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
      '/dagger.lock',
      '/dagger.toml',
    ],
  },
  pnpmWorkspace: {
    minimumReleaseAgeExclude: ['@langri-sha/*', ...Project.presetPackages],
  },
  prettier: {},
  readme: {
    filename: 'readme.md',
  },
  renovate: {
    extends: ['github>langri-sha/renovate-config'],
  },
  typeScriptConfig: {
    config: {
      compilerOptions: {
        noEmit: true,
      },
      include: ['src'],
    },
  },
  worktrunk: {},
  skills: {
    ignore: false,
    skills: [
      {
        source: 'langri-sha/skills',
        ref: 'c0cb19cc68f9c597ac580c0e415bf99dcb69d3fd',
        skills: ['create-commit', 'create-pr'],
      },
    ],
  },
})

project.package?.addField('packageManager', 'pnpm@12.15.0')
project.package?.addField('exports', {
  '.': './src/index.ts',
  './package.json': './package.json',
})
project.package?.addField('publishConfig', {
  access: 'public',
  exports: {
    '.': {
      types: './dist/index.d.ts',
      default: './dist/index.js',
    },
    './package.json': './package.json',
  },
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
