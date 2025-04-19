import React from 'react';
import { Button } from 'react-native-paper';
import { View } from 'react-native';

type Props = {
  onCameraPress: () => void;
  onGalleryPress: () => void;
};

const ImagePickerButtons = ({ onCameraPress, onGalleryPress }: Props) => (
  <View>
    <Button icon="camera" mode="contained" onPress={onCameraPress} style={{ marginBottom: 10 }}>
      Chụp ảnh nhận diện
    </Button>
    <Button icon="image" mode="outlined" onPress={onGalleryPress}>
      Chọn ảnh từ thư viện
    </Button>
  </View>
);

export default ImagePickerButtons;