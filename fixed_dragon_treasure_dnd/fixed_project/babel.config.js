module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    // NOTE: react-native-worklets/plugin is automatically added by babel-preset-expo
    // when react-native-worklets is installed. Do NOT add it manually.
  };
};
