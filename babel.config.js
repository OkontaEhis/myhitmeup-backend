// babel.config.js
export const presets = [
    '@babel/preset-env', // Transpile ES6+ down to ES5
    '@babel/preset-typescript' // If you are using TypeScript
];
export const plugins = [
    '@babel/plugin-transform-runtime' // Optional: for async/await support
];