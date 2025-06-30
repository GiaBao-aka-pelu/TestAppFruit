import { Buffer } from 'buffer';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import RNFS from 'react-native-fs';
import { decode as decodeJpeg } from 'jpeg-js';
import { Alert, Platform } from 'react-native';
global.Buffer = global.Buffer || Buffer; 
export const TARGET_WIDTH = 224;
export const TARGET_HEIGHT = 224;

/**
 * @param uri URI của hình ảnh cần xử lý.
 * @param kenh_Dauvao
 * @returns Một Promise phân giải thành một Float32Array của các pixel hình ảnh, hoặc null nếu có lỗi xảy ra.
 */
export const createImageInputTensor = async (
  uri: string,
  kenh_Dauvao: number
): Promise<Float32Array | null> => {
  console.log(`Đang xử lý hình ảnh để phân loại: ${uri} thành ${TARGET_WIDTH}x${TARGET_HEIGHT} (BHWC) với ${kenh_Dauvao} kênh`);
  try {
    const resize_Anh = await ImageResizer.createResizedImage(
      uri,
      TARGET_WIDTH,
      TARGET_HEIGHT,
      'JPEG',
      100,
      0,
      undefined,
      false,
      {
        mode: 'stretch',
        onlyScaleDown: false,
      }
    );

    if (!resize_Anh.uri) {
      console.error('Lỗi: Không có URI sau khi thay đổi kích thước hình ảnh.');
      return null;
    }

    const imagePath = Platform.OS === 'ios' ? resize_Anh.uri.replace('file://', '') : resize_Anh.uri;
    const imageBase64 = await RNFS.readFile(imagePath, 'base64');
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    const { data: pixelData, width: decodedWidth, height: decodedHeight } = decodeJpeg(imageBuffer, {});

    if (decodedWidth !== TARGET_WIDTH || decodedHeight !== TARGET_HEIGHT) {
      console.warn(`Kích thước hình ảnh sau khi giải mã (${decodedWidth}x${decodedHeight}) không khớp với kích thước đầu vào của mô hình (${TARGET_WIDTH}x${TARGET_HEIGHT}).`);
      Alert.alert(
        'Lỗi xử lý hình ảnh',
        `Kích thước hình ảnh đã thay đổi (${decodedWidth}x${decodedHeight}) không khớp với kích thước đầu vào mong đợi của mô hình (${TARGET_WIDTH}x${TARGET_HEIGHT}). Vui lòng chọn hình ảnh khác hoặc kiểm tra lại cấu hình thay đổi kích thước.`
      );
      return null;
    }

    const inputSize = TARGET_HEIGHT * TARGET_WIDTH * kenh_Dauvao;
    const inputTensor = new Float32Array(inputSize);

    // Chuẩn hóa pixel: Chuyển đổi từ 0-255 sang [0,1] hoặc [-1,1]
    for (let h = 0; h < TARGET_HEIGHT; h++) {
      for (let w = 0; w < TARGET_WIDTH; w++) {
        for (let c = 0; c < kenh_Dauvao; c++) {
          const pixelIndexInRGBA = (h * TARGET_WIDTH + w) * 4;
          let pixelValue: number;

          if (c === 0) { // Đỏ
            pixelValue = pixelData[pixelIndexInRGBA];
          } else if (c === 1) { // Xanh lá
            pixelValue = pixelData[pixelIndexInRGBA + 1];
          } else { // Xanh dương (c === 2)
            pixelValue = pixelData[pixelIndexInRGBA + 2];
          }

          //chuẩn hóa 0-1 (dạng phổ biến)
          // inputTensor[(h * TARGET_WIDTH + w) * kenh_Dauvao + c] = pixelValue / 255.0;

          //huẩn hóa -1 đến 1 (Chuấn MobielNet)
          inputTensor[(h * TARGET_WIDTH + w) * kenh_Dauvao + c] = (pixelValue / 127.5) - 1.0;
        }
      }
    }

    console.log(`Tensor đầu vào được tạo với kích thước ${inputTensor.length}`);
    return inputTensor;
  } catch (e) {
    console.error('Lỗi khi tiền xử lý hình ảnh cho mô hình:', e);
    Alert.alert('Lỗi xử lý hình ảnh', `Không thể tiền xử lý hình ảnh: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
};

/**
 * Áp dụng hàm softmax cho một mảng các logits để chuyển đổi chúng thành xác suất.
 * @param arr Mảng Float32Array của các logits.
 * @returns Một Float32Array mới chứa các xác suất.
 */
export const softmax = (arr: Float32Array): Float32Array => {
  const maxVal = Math.max(...arr);
  const exps = arr.map(x => Math.exp(x - maxVal)); // Ngăn chặn tràn số
  const sumExps = exps.reduce((a, b) => a + b, 0);

  // Thêm kiểm tra để tránh chia cho 0
  if (sumExps <= 0) return new Float32Array(arr.length).fill(1 / arr.length);

  return new Float32Array(exps.map(x => x / sumExps));
};