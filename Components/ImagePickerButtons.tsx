import React, { useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, PermissionsAndroid, Alert, View } from 'react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';

interface ImagePickerButtonsProps {
  onImageSelected: (uri: string) => void;
  isModelLoaded: boolean;
  onCancelOrError: () => void;
}

export const ImagePickerButtons: React.FC<ImagePickerButtonsProps> = ({ onImageSelected, isModelLoaded, onCancelOrError }) => {

  const requestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        let permission;
        if (Platform.Version >= 33) {
          permission = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
        } else {
          permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        }

        const Cap_quyen = await PermissionsAndroid.request(permission, {
          title: 'Quyền truy cập Thư viện ảnh',
          message: 'Ứng dụng cần quyền truy cập thư viện ảnh để bạn có thể chọn hình ảnh.',
          buttonNeutral: 'Hỏi lại sau',
          buttonNegative: 'Hủy',
          buttonPositive: 'OK',
        });
        return Cap_quyen === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Lỗi yêu cầu quyền truy cập thư viện:', err);
        Alert.alert('Lỗi', 'Không thể yêu cầu quyền truy cập thư viện.');
        return false;
      }
    }
    return true;
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const Cap_quyen = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Quyền truy cập Camera',
            message: 'Ứng dụng cần quyền truy cập camera để chụp ảnh.',
            buttonNeutral: 'Hỏi lại sau',
            buttonNegative: 'Hủy',
            buttonPositive: 'OK',
          },
        );
        return Cap_quyen === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Lỗi yêu cầu quyền camera:', err);
        Alert.alert('Lỗi', 'Không thể yêu cầu quyền truy cập camera.');
        return false;
      }
    }
    return true;
  };

  const chon_Anh = useCallback(async () => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert('Quyền bị từ chối', 'Bạn cần cấp quyền truy cập thư viện ảnh để sử dụng tính năng này.');
      onCancelOrError();
      return;
    }

    const result: ImagePickerResponse = await launchImageLibrary({ mediaType: 'photo' });

    if (result.didCancel) {
      console.log('Người dùng đã hủy chọn ảnh');
      onCancelOrError();
    } else if (result.errorMessage) {
      console.error('Lỗi ImagePicker: ', result.errorMessage);
      Alert.alert('Lỗi', `Không thể chọn ảnh: ${result.errorMessage}`);
      onCancelOrError();
    } else if (result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      if (uri) {
        onImageSelected(uri);
      }
    }
  }, [onImageSelected, onCancelOrError]);

  const chon_Chup_Anh = useCallback(async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Quyền bị từ chối', 'Bạn cần cấp quyền truy cập camera để sử dụng tính năng này.');
      onCancelOrError();
      return;
    }

    const result: ImagePickerResponse = await launchCamera({ mediaType: 'photo', cameraType: 'back' });

    if (result.didCancel) {
      console.log('Người dùng đã hủy chụp ảnh');
      onCancelOrError();
    } else if (result.errorMessage) {
      console.error('Lỗi Camera: ', result.errorMessage);
      Alert.alert('Lỗi', `Không thể chụp ảnh: ${result.errorMessage}`);
      onCancelOrError();
    } else if (result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      if (uri) {
        onImageSelected(uri);
      }
    }
  }, [onImageSelected, onCancelOrError]);

  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={[styles.button, !isModelLoaded && styles.buttonDisabled]}
        onPress={chon_Anh}
        disabled={!isModelLoaded}
      >
        <Text style={styles.buttonText}>
          {isModelLoaded ? 'Chọn ảnh từ Thư viện' : 'Đang tải mô hình...'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.cameraButton, !isModelLoaded && styles.buttonDisabled]}
        onPress={chon_Chup_Anh}
        disabled={!isModelLoaded}
      >
        <Text style={styles.buttonText}>
          {isModelLoaded ? 'Chụp ảnh bằng Camera' : 'Đang tải mô hình...'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#6200EE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 30,
    marginBottom: 15,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  cameraButton: {
    backgroundColor: '#03DAC6',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 10,
  },
  buttonIcon: {
    marginRight: 5,
  },
});
