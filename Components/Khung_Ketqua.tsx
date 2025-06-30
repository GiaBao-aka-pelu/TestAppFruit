import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');

interface ClassificationResult {
  label: string;
  confidence: number;
  description: string;
}

interface Khung_KetQuaProps {
  imageUri: string | null;
  classificationResult: ClassificationResult | null;
  modelStatusMessage: string;
}

export const ResultDisplay: React.FC<Khung_KetQuaProps> = ({
  imageUri,
  classificationResult,
  modelStatusMessage,
}) => {
  const isLoadingModel = modelStatusMessage.includes('Đang tải mô hình') || modelStatusMessage.includes('Đang chạy mô hình');
  const isProcessingImage = classificationResult?.label.includes('Đang xử lý hình ảnh');

  return (
    <View style={styles.container}>
      {imageUri ? (
        <View style={styles.imagePreviewContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.imagePreview}
            resizeMode="cover" // cover để ảnh đầy khung hơn
          />
          {isProcessingImage && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Đang phân tích...</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>Chọn ảnh để bắt đầu phân loại</Text>
        </View>
      )}

      <View style={styles.resultCard}>
        {isLoadingModel && (
          <View style={styles.loadingIndicatorContainer}>
            <ActivityIndicator size="small" color="#6200EE" />
            <Text style={styles.statusText}>{modelStatusMessage}</Text>
          </View>
        )}
        {!isLoadingModel && classificationResult ? (
          <>
            <Text style={styles.resultTitle}>Kết quả nhận diện:</Text>
            <Text style={styles.resultLabel}>
              {classificationResult.label}{' '}
              {classificationResult.confidence > 0 && (
                <Text style={styles.confidenceText}>
                  ({(classificationResult.confidence * 100).toFixed(1)}% tin cậy)
                </Text>
              )}
            </Text>
            {classificationResult.description ? (
              <Text style={styles.descriptionText}>{classificationResult.description}</Text>
            ) : null}
          </>
        ) : (
          !isLoadingModel && (
            <Text style={styles.noResultText}>
              {imageUri ? 'Chưa có kết quả phân loại.' : 'Chưa có ảnh được chọn.'}
            </Text>
          )
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: 20,
  },
  imagePreviewContainer: {
    marginTop: 20,
    width: width * 0.8,
    height: width * 0.6,
    borderRadius: 15,
    overflow: 'hidden', // Đảm bảo ảnh bo tròn
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholderImage: {
    marginTop: 20,
    width: width * 0.8,
    height: width * 0.6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#cccccc',
    borderStyle: 'dashed', // Đường viền nét đứt
    backgroundColor: '#e9e9e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999999',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  resultCard: {
    marginTop: 30, // Khoảng cách lớn hơn
    width: '90%',
    backgroundColor: 'white',
    padding: 25, // Tăng padding
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 7,
    alignItems: 'center',
    minHeight: 120, // Chiều cao tối thiểu
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#444444',
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 24, // Kích thước lớn hơn cho kết quả chính
    fontWeight: 'bold',
    color: '#6200EE', // Màu tím chính
    textAlign: 'center',
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 18,
    color: '#03DAC6', // Màu xanh ngọc cho độ tin cậy
    fontWeight: 'normal',
  },
  descriptionText: {
    fontSize: 16,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#888888',
    marginTop: 10,
    textAlign: 'center',
  },
  noResultText: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
  },
  loadingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});