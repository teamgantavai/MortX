const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'lucide-react') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/lucide-react/dist/cjs/lucide-react.js'),
      type: 'sourceFile',
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

module.exports = config;
