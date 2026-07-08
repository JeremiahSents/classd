const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);
const escapedProjectRoot = projectRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

config.resolver.unstable_enablePackageExports = true;
config.watchFolders = config.watchFolders?.filter(
  (folder) => !folder.startsWith(`${projectRoot}\\dist`),
);
config.resolver.blockList = [
  new RegExp(`^${escapedProjectRoot}[/\\\\]dist[/\\\\].*`),
];

module.exports = withNativeWind(config, { input: "./global.css" });
