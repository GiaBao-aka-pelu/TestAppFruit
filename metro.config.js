const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
    resolver: {
    // Thêm 'tflite' vào danh sách các phần mở rộng tài sản được hỗ trợ
    assetExts: ['tflite', ...getDefaultConfig(__dirname).resolver.assetExts],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
