import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { useModelHandler } from './Hooks/Tai_Model';
import { ImagePickerButtons } from './Components/ImagePickerButtons';
import { ResultDisplay } from './Components/Khung_Ketqua';
import { JSX } from 'react/jsx-runtime';

export default function App(): JSX.Element {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const { tfliteModel, modelStatusMessage, classifyImage, classificationResult, resetClassification } = useModelHandler();

  const chon_Hinhanh = useCallback((uri: string) => {
    setImageUri(uri);
    classifyImage(uri);
  }, [classifyImage]);

  
  const resetApp = useCallback(() => {
    setImageUri(null);
    resetClassification();
  }, [resetClassification]);


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.container}>
          <Text style={styles.title}>Nhận diện, phân loại trái cây</Text>
          <Text style={styles.subtitle}>Sử dụng AI để biết thông tin về trái cây của bạn</Text>

          <ImagePickerButtons
            onImageSelected={(uri) => {
              chon_Hinhanh(uri);
            }}
            isModelLoaded={tfliteModel !== undefined}
            onCancelOrError={resetApp}
          />

          <ResultDisplay
            imageUri={imageUri}
            classificationResult={classificationResult}
            modelStatusMessage={modelStatusMessage}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8', // Màu nền tổng thể
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30, // Tăng khoảng cách trên dưới
  },
  container: {
    width: '90%', // Chiếm 90% chiều rộng màn hình
    maxWidth: 500, // Giới hạn chiều rộng tối đa trên các màn hình lớn
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff', // Nền cho khu vực nội dung chính
    borderRadius: 15, // Bo tròn các góc
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 }, // Bóng đổ sâu hơn
    shadowOpacity: 0.08, // Độ trong suốt của bóng
    shadowRadius: 15, // Độ mờ của bóng
    elevation: 8, // Android shadow
  },
  title: {
    fontSize: 26, // Kích thước lớn hơn
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333', // Màu chữ đậm hơn
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22, // Tăng khoảng cách dòng
  },
});