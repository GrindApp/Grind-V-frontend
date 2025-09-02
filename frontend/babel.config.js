module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      "babel-preset-expo",
      "nativewind/babel",
    ],
    plugins: [
      // Remove react-native-dotenv since we're using EXPOPUBLIC env vars
      ["react-native-reanimated/plugin"],
    ],
  };
};