import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    '.nuxt/**',
  ],
}, {
  files: ['scripts/**/*.{js,mjs,ts}', 'server/**/*.{js,mjs,ts}', 'bin/**/*.{js,mjs,ts}', 'test/**/*.{js,mjs,ts}'],
  rules: {
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',
    'vars-on-top': 'off',
  },
})
