module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.(spec|test).ts"],
  collectCoverageFrom: [
    "<rootDir>/src/app/lib/markdown/**/*.ts",
    "<rootDir>/src/app/lib/date/**/*.ts",
  ],
};
