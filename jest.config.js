module.exports = {
  preset: "ts-jest",
  silent: true,
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.(spec|test).ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "<rootDir>/src/app/lib/markdown/**/*.ts",
    "<rootDir>/src/app/lib/date/**/*.ts",
    "<rootDir>/src/app/lib/sqlite/**/*.ts",
    "<rootDir>/src/app/lib/importer/**/*.ts",
    "<rootDir>/src/app/lib/exporter/**/*.ts",
    "<rootDir>/src/app/api/**/*.ts",
  ],
};
