const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Exclude server-only modules from the client bundle
// These packages are only used on the server side and should not be bundled for mobile
const serverOnlyModules = [
  "mysql2",
  "express",
  "jose",
  "drizzle-orm",
  "drizzle-kit",
  "tsx",
  "esbuild",
];

config.resolver = {
  ...config.resolver,
  blockList: [
    // Block server-only directories from being bundled
    /\/server\/_core\/index\.ts$/,
  ],
};

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
