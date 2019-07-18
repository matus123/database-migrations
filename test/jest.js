module.exports = {
  preset: 'ts-jest',
  verbose: true,
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      diagnostics: false,
      // diagnostics: {
      // 	warnOnly: true
      // }
    },
  },
};
