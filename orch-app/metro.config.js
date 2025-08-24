const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 */
const config = {
  resolver: {
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@screens': path.resolve(__dirname, 'src/screens'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@store': path.resolve(__dirname, 'src/store'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@navigation': path.resolve(__dirname, 'src/navigation'),
    },
  },
  transformer: {
    babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);