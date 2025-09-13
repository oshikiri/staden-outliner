// RV: このファイルは PostCSS 設定です。JSDoc の型は `tailwindcss`.Config ではなく、PostCSS 用（例えば `import('postcss-load-config').Config`）に合わせるか、型注釈自体を省略してください。
/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line import/no-anonymous-default-export
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
