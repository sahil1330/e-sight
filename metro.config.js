const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

/** @type {import('
 * expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add .sql file support for Drizzle
config.resolver.assetExts.push('sql');

module.exports = withNativeWind(config, { input: './app/global.css' });