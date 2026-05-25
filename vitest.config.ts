import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    passWithNoTests: true, // 没测试也算通过
  },
})
