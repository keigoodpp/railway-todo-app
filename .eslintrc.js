module.exports = {
  parser: '@babel/eslint-parser', // パーサーの設定
  settings: {
    react: {
      version: 'detect', // Reactのバージョンを自動検出
    },
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true, // 環境設定
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended', // 拡張機能
  ],
  parserOptions: {
    requireConfigFile: false, // Babelの設定ファイルを必要としない
    babelOptions: {
      presets: ['@babel/preset-react'], // JSXのサポートを追加
    },
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react'], // プラグイン
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off', // ルール
  },
};
