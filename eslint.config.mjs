// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Your custom configs here
  {
    rules: {
      'no-var': 'error',
      'vue/html-self-closing': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
)
