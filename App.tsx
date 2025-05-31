import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { useTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import RNFS from 'react-native-fs';
import { JSX } from 'react/jsx-runtime';
import { decode as decodeJpeg } from 'jpeg-js';
const { width } = Dimensions.get('window');

// --- HÀM XỬ LÝ HÌNH ẢNH THÀNH PIXEL DATA CHO MODEL ---
const createImageInputTensor = async (
  uri: string,
  //inputWidth: number,
  //inputHeight: number,
  inputChannels: number
): Promise<Float32Array | null> => {
  const TARGET_WIDTH = 640;
  const TARGET_HEIGHT = 640;

  console.log(`Processing image: ${uri} to ${TARGET_WIDTH}x${TARGET_HEIGHT} with ${inputChannels} channels`);
  //console.log(`Processing image: ${uri} to ${inputWidth}x${inputHeight} with ${inputChannels} channels`);
  try {
    // 1. Resize ảnh về kích thước mong muốn của mô hình
    // Chúng ta sẽ ép ảnh về JPEG để có thể dùng `jpeg-js` dễ dàng.
    const resizedImage = await ImageResizer.createResizedImage(
      uri,
      TARGET_WIDTH,//inputWidth,
      TARGET_HEIGHT,//inputHeight,
      'JPEG', // Định dạng đầu ra sau khi resize
      100, // Chất lượng nén (1-100)
      0, // Góc xoay (0, 90, 180, 270)
      undefined, // Đường dẫn lưu file tạm thời, undefined để sử dụng mặc định
      false, // Không cho phép upscale nếu ảnh nhỏ hơn kích thước đích
      {
        mode: 'stretch', //'stretch' kéo dãn ảnh đúng với kích thước 640x640
                        // 'cover' sẽ cắt ảnh để lấp đầy kích thước đích.
                        // 'contain' sẽ giữ nguyên tỷ lệ, thêm khoảng trống nếu cần.
        onlyScaleDown: false,
      }
    );

    if (!resizedImage.uri) {
      console.error('Lỗi: Không có URI sau khi resize ảnh.');
      return null;
    }

    // 2. Đọc file ảnh đã resize dưới dạng Base64
    // Đối với iOS, URI từ ImageResizer đôi khi cần loại bỏ 'file://' prefix.
    const imagePath = Platform.OS === 'ios' ? resizedImage.uri.replace('file://', '') : resizedImage.uri;
    const imageBase64 = await RNFS.readFile(imagePath, 'base64');

    // Chuyển chuỗi Base64 sang Buffer.

    const imageBuffer = Buffer.from(imageBase64, 'base64');

    // 3. Giải mã ảnh JPEG để lấy dữ liệu pixel thô (RGBA)
    const { data: pixelData, width: decodedWidth, height: decodedHeight } = decodeJpeg(imageBuffer, {
      // Có thể thêm tùy chọn giải mã nếu cần thiết, ví dụ: colorTransform: true
    });

    if (decodedWidth !== TARGET_WIDTH || decodedHeight !== TARGET_HEIGHT) {
        console.warn(`Kích thước ảnh sau giải mã (${decodedWidth}x${decodedHeight}) không khớp với kích thước đầu vào của mô hình (${TARGET_WIDTH}x${TARGET_HEIGHT}). Vui lòng kiểm tra lại resizeMode và kích thước đầu vào của mô hình.`);
        // Trong một số trường hợp, `ImageResizer` có thể không tạo ra kích thước chính xác tuyệt đối.
        // Đây là một cảnh báo để bạn kiểm tra, nhưng thường không gây lỗi nếu sự chênh lệch nhỏ.
        if (decodedWidth !== TARGET_WIDTH || decodedHeight !== TARGET_HEIGHT) {
             Alert.alert(
                'Lỗi xử lý ảnh',
                `Ảnh sau resize không đúng kích thước mong muốn (${decodedWidth}x${decodedHeight} thay vì ${TARGET_WIDTH}x${TARGET_HEIGHT}). Vui lòng chọn ảnh khác hoặc kiểm tra lại cấu hình resize.`
            );
            return null; // Thoát nếu kích thước không khớp
        }
    }

    // 4. Chuẩn bị tensor đầu vào cho mô hình
    const inputSize = TARGET_WIDTH * TARGET_HEIGHT * inputChannels;
    const inputTensor = new Float32Array(inputSize);

    // Chuẩn hóa pixel: Chuyển đổi từ 0-255 sang định dạng mô hình mong đợi (ví dụ: 0-1 hoặc -1 đến 1).
    // RẤT QUAN TRỌNG: Điều chỉnh phần này để phù hợp chính xác với cách mô hình của bạn được huấn luyện!
    // Ví dụ phổ biến nhất là chuẩn hóa về khoảng [0, 1] hoặc [-1, 1].
    // Giả sử mô hình của bạn mong đợi ảnh RGB và giá trị pixel từ 0.0 đến 1.0.
    for (let i = 0; i < TARGET_WIDTH * TARGET_HEIGHT; i++) {
        const pixelIndex = i * 4; // Mỗi pixel trong `pixelData` có 4 kênh: R, G, B, A
        const r = pixelData[pixelIndex];
        const g = pixelData[pixelIndex + 1];
        const b = pixelData[pixelIndex + 2];
        // Bỏ qua pixelData[pixelIndex + 3] (kênh Alpha) nếu mô hình của bạn chỉ có 3 kênh (RGB).

        // Đảm bảo thứ tự kênh màu và chuẩn hóa giá trị
        // Ví dụ: RGB và chuẩn hóa về 0-1
        inputTensor[i * inputChannels] = r / 255.0;      // Kênh Đỏ
        inputTensor[i * inputChannels + 1] = g / 255.0;  // Kênh Xanh Lá
        inputTensor[i * inputChannels + 2] = b / 255.0;  // Kênh Xanh Dương

        // --- CÁC TÙY CHỌN CHUẨN HÓA KHÁC (UNCOMMENT NẾU CẦN) ---
        // Ví dụ: Chuẩn hóa về [-1, 1]
        // inputTensor[i * inputChannels] = (r / 127.5) - 1.0;
        // inputTensor[i * inputChannels + 1] = (g / 127.5) - 1.0;
        // inputTensor[i * inputChannels + 2] = (b / 127.5) - 1.0;

        // Ví dụ: Nếu mô hình mong đợi thứ tự BGR (thay vì RGB)
        // inputTensor[i * inputChannels] = b / 255.0;      // Kênh Xanh Dương
        // inputTensor[i * inputChannels + 1] = g / 255.0;  // Kênh Xanh Lá
        // inputTensor[i * inputChannels + 2] = r / 255.0;  // Kênh Đỏ
    }

    console.log(`Input tensor created with size ${inputTensor.length}`);
    return inputTensor;
  } catch (e) {
    console.error('Lỗi khi tiền xử lý ảnh cho mô hình:', e);
    Alert.alert('Lỗi xử lý ảnh', `Không thể tiền xử lý ảnh: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
};


const LABELS: string[] = ['class_0', 'class_1', 'class_2', 'class_3', 'class_4']; // Thay thế bằng các lớp thực tế của bạn

export default function App(): JSX.Element {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [classificationResult, setClassificationResult] = useState<string>('Chưa có hình ảnh được chọn.');

  // Load mô hình TFLite từ asset
  const modelHook = useTensorflowModel(require('./android/app/src/main/assets/best_float16.tflite'));
  const tfliteModel: TensorflowModel | undefined = modelHook.state === 'loaded' ? modelHook.model : undefined;

  // Lấy shape đầu vào của mô hình.
  // modelInputShape thường là [batch_size, height, width, channels] hoặc [batch_size, width, height, channels].
  // Bạn CẦN KIỂM TRA ĐÚNG THỨ TỰ của mô hình bạn đã huấn luyện.
  // Ví dụ: Đối với ảnh, thường là [1, height, width, 3]
  const modelInputShape: number[] | undefined = tfliteModel?.inputs[0]?.shape;

  useEffect(() => {
    if (modelHook.state === 'loaded') {
      console.log('Model loaded successfully!');
      if (tfliteModel && tfliteModel.inputs[0]) {
        console.log('Model input shape:', tfliteModel.inputs[0].shape);
        // Kiểm tra để đảm bảo hình dạng là 4 chiều (batch, height, width, channels)
        if (tfliteModel.inputs[0].shape.length !== 4) {
            console.warn('Cảnh báo: Hình dạng đầu vào của mô hình không phải là 4 chiều. Có thể có vấn đề với mô hình hoặc cách bạn đọc shape.');
        }
      }
    } else if (modelHook.state === 'error') {
      const { error } = modelHook as { state: 'error'; error: Error };
      console.error('Failed to load model:', error);
      setClassificationResult(`Lỗi tải mô hình: ${error.message}`);
    } else if (modelHook.state === 'loading') {
      setClassificationResult('Đang tải mô hình...');
    }
  }, [modelHook.state, tfliteModel]);


  const handleSelectImage = useCallback(async () => {
    // --- PHẦN YÊU CẦU QUYỀN (Đã có sẵn và hoạt động tốt) ---
    if (Platform.OS === 'android') {
      let permissionGranted = false;
      try {
        let permission;
        // API level 33+ cần READ_MEDIA_IMAGES, các phiên bản cũ hơn dùng READ_EXTERNAL_STORAGE
        if (Platform.Version >= 33) {
          permission = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
        } else {
          permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        }

        const granted = await PermissionsAndroid.request(permission, {
          title: 'Quyền truy cập Thư viện ảnh',
          message: 'Ứng dụng cần quyền truy cập thư viện ảnh để bạn có thể chọn hình ảnh.',
          buttonNeutral: 'Hỏi lại sau',
          buttonNegative: 'Hủy',
          buttonPositive: 'OK',
        });

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Quyền truy cập thư viện ảnh được cấp.');
          permissionGranted = true;
        } else {
          console.log('Quyền truy cập thư viện ảnh bị từ chối.');
          Alert.alert(
            'Quyền bị từ chối',
            'Bạn cần cấp quyền truy cập thư viện ảnh để sử dụng tính năng này. Vui lòng vào Cài đặt ứng dụng để cấp quyền thủ công.'
          );
        }
      } catch (err) {
        console.warn('Lỗi yêu cầu quyền:', err);
        Alert.alert('Lỗi', 'Không thể yêu cầu quyền truy cập thư viện.');
      }
      if (!permissionGranted) {
        return;
      }
    }

    const result: ImagePickerResponse = await launchImageLibrary({ mediaType: 'photo' });

    if (result.didCancel) {
      console.log('Người dùng đã hủy chọn ảnh');
    } else if (result.errorMessage) {
      console.error('Lỗi ImagePicker: ', result.errorMessage);
      Alert.alert('Lỗi', `Không thể chọn ảnh: ${result.errorMessage}`);
    } else if (result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      if (uri) {
        setImageUri(uri);
        setClassificationResult('Đang xử lý hình ảnh...');

        if (!tfliteModel || !modelInputShape) {
          setClassificationResult('Mô hình chưa tải hoặc không có thông tin đầu vào.');
          return;
        }
        
        // Lấy kích thước đầu vào của mô hình từ modelInputShape.
        // Ví dụ: modelInputShape = [1, 224, 224, 3] (Batch, Height, Width, Channels)
        //const inputHeight = modelInputShape[1];
        //const inputWidth = modelInputShape[2];
        const inputChannels = modelInputShape[3];
/*
        if (inputWidth === undefined || inputHeight === undefined || inputChannels === undefined) {
            setClassificationResult('Không thể xác định kích thước đầu vào của mô hình từ shape.');
            console.error('Model input shape is invalid or missing dimensions:', modelInputShape);
            return;
        }

        try {
          // Gọi hàm xử lý ảnh thực tế đã được cập nhật
          const inputTensor = await createImageInputTensor(uri, inputWidth, inputHeight, inputChannels);

          if (inputTensor) {
            // Chạy mô hình với tensor đầu vào
            const output: ArrayBuffer[] = await tfliteModel.run([inputTensor]);

            // Xử lý kết quả đầu ra
            // Giả sử đầu ra là một mảng Float32Array chứa xác suất cho mỗi lớp
            const outputArray = new Float32Array(output[0]);

            let maxProbability = -1;
            let predictedIndex = -1;
            for (let i = 0; i < outputArray.length; i++) {
              if (outputArray[i] > maxProbability) {
                maxProbability = outputArray[i];
                predictedIndex = i;
              }
            }

            if (predictedIndex !== -1 && LABELS[predictedIndex]) {
              setClassificationResult(`Kết quả: ${LABELS[predictedIndex]} (${(maxProbability * 100).toFixed(2)}%)`);
            } else {
              setClassificationResult('Không thể phân loại hoặc kết quả không hợp lệ.');
            }

          } else {
            setClassificationResult('Lỗi tiền xử lý hình ảnh.');
          }
        } catch (error: any) {
          console.error('Lỗi khi chạy mô hình:', error);
          setClassificationResult(`Lỗi trong quá trình phân loại: ${error.message}`);
        }
      }
    }
  }, [tfliteModel, modelInputShape]); // Thêm modelInputShape vào dependencies để useCallback hoạt động đúng
*/
          if (inputChannels === undefined) { // Chỉ kiểm tra inputChannels
            setClassificationResult('Không thể xác định số kênh đầu vào của mô hình từ shape.');
            console.error('Model input shape is invalid or missing channels:', modelInputShape);
            return;
        }

        try {
          // Chỉ truyền uri và inputChannels vào hàm createImageInputTensor
          const inputTensor = await createImageInputTensor(uri, inputChannels);

          if (inputTensor) {
            const output: ArrayBuffer[] = await tfliteModel.run([inputTensor]);

            const outputArray = new Float32Array(output[0]);

            let maxProbability = -1;
            let predictedIndex = -1;
            for (let i = 0; i < outputArray.length; i++) {
              if (outputArray[i] > maxProbability) {
                maxProbability = outputArray[i];
                predictedIndex = i;
              }
            }

            if (predictedIndex !== -1 && LABELS[predictedIndex]) {
              setClassificationResult(`Kết quả: ${LABELS[predictedIndex]} (${(maxProbability * 100).toFixed(2)}%)`);
            } else {
              setClassificationResult('Không thể phân loại hoặc kết quả không hợp lệ.');
            }

          } else {
            setClassificationResult('Lỗi tiền xử lý hình ảnh.');
          }
        } catch (error: any) {
          console.error('Lỗi khi chạy mô hình:', error);
          setClassificationResult(`Lỗi trong quá trình phân loại: ${error.message}`);
        }
      }
    }
  }, [tfliteModel, modelInputShape]);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Phân loại ảnh với TFLite</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleSelectImage}
        disabled={modelHook.state !== 'loaded'} // Nút bị vô hiệu hóa cho đến khi mô hình tải xong
      >
        <Text style={styles.buttonText}>
          {modelHook.state === 'loaded' ? 'Chọn ảnh từ Thư viện' : 'Đang tải mô hình...'}
        </Text>
      </TouchableOpacity>

      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={styles.imagePreview}
          resizeMode="contain"
        />
      )}

      <View style={styles.resultContainer}>
        <Text style={styles.resultText}>{classificationResult}</Text>
        {modelHook.state === 'loaded' && (
          <Text style={styles.statusText}>Mô hình đã tải thành công!</Text>
        )}
        {modelHook.state === 'loading' && (
          <Text style={styles.statusText}>Đang tải mô hình...</Text>
        )}
        {modelHook.state === 'error' && (
          <Text style={styles.statusText}>Lỗi tải mô hình: {modelHook.error?.message}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 100,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  imagePreview: {
    marginTop: 20,
    width: width * 0.8,
    height: width * 0.6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#e0e0e0',
  },
  resultContainer: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});