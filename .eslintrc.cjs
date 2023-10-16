module.exports = {
  root: true,
  overrides: [{
    files: [ './**/*.{ts,vue}' ]
  }],
  ignorePatterns: [ 'dist' ],
  env: {
    browser: true
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: "@typescript-eslint/parser",
    sourceType: 'module',
    project: true,
    tsconfigRootDir: __dirname,
    extraFileExtensions: [ '.vue' ],
    vueFeatures: {
      interpolationAsNonHTML: false
    }
  },
  plugins: [ '@typescript-eslint' ],
  extends: [
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
  ],
  rules: {
    indent: [ 'error', 2, { SwitchCase: 1 }],
    'max-len': [ 'error', {
      code: 80,
      tabWidth: 2
    }],
    'vue/block-order': ['warn', {
      order: [ 'template', 'style', 'script' ]
    }],
    'vue/component-tags-order': 'off',
    'vue/html-closing-bracket-spacing': 'error',
    'vue/html-indent': 'error',    
    'vue/max-attributes-per-line': ['warn', {
      singleline: { max: 12 },
      multiline: { max: 1 }
    }],
    'vue/multi-word-component-names': 'off',
    'vue/require-default-prop': 'off',
    'vue/singleline-html-element-content-newline': 'off'   
  }
}
