import { useState, useEffect, useCallback } from 'react';
import { useTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { createImageInputTensor, softmax } from '../Tien_Xu_Ly';
import { LABELS_CLASSIFICATION } from '../Data/labels';
import { FRUIT_DESCRIPTIONS } from '../Data/fruitDescriptions';

interface ClassificationResult {
  label: string;
  confidence: number;
  description: string;
}

interface ModelHandlerHook {
  tfliteModel: TensorflowModel | undefined;
  modelStatusMessage: string;
  classifyImage: (uri: string) => Promise<void>;
  classificationResult: ClassificationResult | null;
  resetClassification: () => void;
}

export const useModelHandler = (): ModelHandlerHook => {
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [modelStatusMessage, setModelStatusMessage] = useState<string>('Đang tải mô hình...');

  // Tải mô hình từ file android/assets.
  const modelHook = useTensorflowModel(require('../android/app/src/main/assets/model.tflite'));
  const tfliteModel: TensorflowModel | undefined = modelHook.state === 'loaded' ? modelHook.model : undefined;

  useEffect(() => {
    if (modelHook.state === 'loaded') {
      console.log('Mô hình đã tải thành công!');
      if (tfliteModel && tfliteModel.inputs[0] && tfliteModel.outputs[0]) {
        console.log('Kích thước đầu vào mô hình:', tfliteModel.inputs[0].shape);
        console.log('Kích thước đầu ra mô hình:', tfliteModel.outputs[0].shape);

        // Kiểm tra input của mô hình (BHWC: [1, 224, 224, 3])
        if (tfliteModel.inputs[0].shape.length !== 4 || tfliteModel.inputs[0].shape[1] !== 224 || tfliteModel.inputs[0].shape[2] !== 224 || tfliteModel.inputs[0].shape[3] !== 3) {
          console.warn('Cảnh báo! Mô hình không chuẩn BHWC (1,224,224,3). Vui lòng kiểm tra lại.');
        }
        // Kiểm tra output mô hình ([1, N_CLASSES])
        if (tfliteModel.outputs[0].shape.length !== 2 || tfliteModel.outputs[0].shape[0] !== 1 || tfliteModel.outputs[0].shape[1] !== LABELS_CLASSIFICATION.length) {
          console.warn(`Cảnh báo! Đầu ra mô hình không đạt chuẩn [1, ${LABELS_CLASSIFICATION.length}]. Vui lòng kiểm tra mô hình và nhãn dán.`);
        }
      }
      setModelStatusMessage('Ứng dụng đã sẵn sàng! Chọn ảnh hoặc chụp ảnh để phân loại.');
    } else if (modelHook.state === 'error') {
      const { error } = modelHook as { state: 'error'; error: Error };
      console.error('Không thể tải mô hình:', error);
      setModelStatusMessage(`Lỗi tải mô hình: ${error.message}`);
    } else if (modelHook.state === 'loading') {
      setModelStatusMessage('Đang tải mô hình...');
    }
  }, [modelHook.state, tfliteModel]);

  const classifyImage = useCallback(async (uri: string) => {
    setClassificationResult({ label: 'Đang xử lý hình ảnh...', confidence: 0, description: '' });
    setModelStatusMessage('Đang chạy mô hình...');

    if (!tfliteModel || !tfliteModel.inputs[0] || !tfliteModel.outputs[0]) {
      setClassificationResult({
        label: 'Mô hình chưa tải hoặc không có thông tin đầu vào/đầu ra.',
        confidence: 0,
        description: ''
      });
      return;
    }

    const modelInputShape = tfliteModel.inputs[0].shape;
    const modelOutputShape = tfliteModel.outputs[0].shape;
    const kenh_Dauvao = modelInputShape[3];

    if (kenh_Dauvao === undefined || kenh_Dauvao !== 3) {
      setClassificationResult({
        label: 'Lỗi: Mô hình không có 3 kênh đầu vào (RGB) hoặc shape không hợp lệ.',
        confidence: 0,
        description: ''
      });
      console.error('Ảnh đầu vào không hợp lệ!:', modelInputShape);
      return;
    }

    try {
      const inputTensor = await createImageInputTensor(uri, kenh_Dauvao);
      if (inputTensor) {
        const output: ArrayBuffer[] = await tfliteModel.run([inputTensor]);
        const outputArray = new Float32Array(output[0]);

        // DEBUG: Kiểm tra output thô
        console.log('Giá trị output thô:', Array.from(outputArray).map(x => x.toFixed(4)));
        console.log('Tổng output:', outputArray.reduce((a, b) => a + b, 0).toFixed(2));

        // Xác định xem có cần áp dụng softmax hay không
        let probabilities: Float32Array;
        const outputSum = outputArray.reduce((a, b) => a + b, 0);

        // Một phỏng đoán đơn giản: nếu tổng không gần 1, áp dụng softmax.
        if (Math.abs(outputSum - 1.0) > 0.1 && outputArray.length === LABELS_CLASSIFICATION.length) {
          console.log('Sử dụng hàm Softmax để chuyển logits thành xác suất');
          probabilities = softmax(outputArray);
        } else {
          console.log('Output dường như đã là xác suất hoặc không phù hợp để áp dụng softmax dựa trên tổng.');
          probabilities = outputArray;
        }

        // Đảm bảo mảng xác suất có độ dài chính xác cho các nhãn
        if (probabilities.length !== LABELS_CLASSIFICATION.length) {
            console.error(`Không khớp giữa độ dài xác suất đầu ra (${probabilities.length}) và độ dài nhãn (${LABELS_CLASSIFICATION.length}).`);
            setClassificationResult({
                label: 'Lỗi: Số lượng lớp dự đoán không khớp với số lượng nhãn.',
                confidence: 0,
                description: ''
            });
            return;
        }

        // DEBUG: Kiểm tra sau softmax
        console.log('Xác suất:', Array.from(probabilities).map(x => x.toFixed(4)));
        console.log('Tổng xác suất:', probabilities.reduce((a, b) => a + b, 0).toFixed(2));

        // Xử lý kết quả
        let maxProbability = -1;
        let predictedIndex = -1;
        for (let i = 0; i < probabilities.length; i++) {
          if (probabilities[i] > maxProbability) {
            maxProbability = probabilities[i];
            predictedIndex = i;
          }
        }

        if (predictedIndex >= 0 && predictedIndex < LABELS_CLASSIFICATION.length) {
          const predictedLabel = LABELS_CLASSIFICATION[predictedIndex];
          setClassificationResult({
            label: predictedLabel,
            confidence: maxProbability,
            description: FRUIT_DESCRIPTIONS[predictedLabel] || 'Không có mô tả chi tiết.',
          });
        } else {
          setClassificationResult({
            label: 'Không thể phân loại (chỉ số dự đoán không hợp lệ).',
            confidence: 0,
            description: '',
          });
        }
      } else {
        setClassificationResult({
          label: 'Không thể tạo tensor đầu vào từ ảnh.',
          confidence: 0,
          description: '',
        });
      }
    } catch (error: any) {
      console.error('Lỗi khi chạy mô hình:', error);
      setClassificationResult({
        label: `Lỗi trong quá trình phân loại: ${error.message}`,
        confidence: 0,
        description: '',
      });
    } finally {
      setModelStatusMessage('Mô hình sẵn sàng.');
    }
  }, [tfliteModel]);

  const resetClassification = useCallback(() => {
    setClassificationResult(null);
    setModelStatusMessage('Ứng dụng đã sẵn sàng! Chọn ảnh hoặc chụp ảnh để phân loại.');
  }, []);

  return {
    tfliteModel,
    modelStatusMessage,
    classifyImage,
    classificationResult,
    resetClassification,
  };
};