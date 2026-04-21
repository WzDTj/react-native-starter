module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|@react-navigation|react-redux|@reduxjs/toolkit|@sentry|react-native-safe-area-context|react-native-screens|immer|redux|redux-thunk|reselect)/)',
  ],
};
