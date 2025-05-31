const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
<<<<<<< HEAD
const config = {
    resolver: {
    // Thêm 'tflite' vào danh sách các phần mở rộng tài sản được hỗ trợ
    assetExts: ['tflite', ...getDefaultConfig(__dirname).resolver.assetExts],
  },
};
=======
const config = {};
>>>>>>> 56335ddf60d6d7697180413888dbe47c422617d3

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
