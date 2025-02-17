// jest.config.mjs
export default {
  transform: {
    "^.+\\.jsx?$": "babel-jest", // Transform JS files using Babel
  },
  testEnvironment: "node", // Set the test environment to Node.js
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'], // File extensions Jest will recognize
};