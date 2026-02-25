module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["./jest-setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!(?:.?)react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-reanimated|expo-router|expo-constants|expo-file-system|react-native-safe-area-context|@testing-library|@gorhom|marked)",
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/mocks/**",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
