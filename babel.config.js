module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // react-native-worklets/plugin powers Reanimated 4 worklets.
  // IMPORTANT: it must be the LAST plugin in the list.
  plugins: ['react-native-worklets/plugin'],
};
