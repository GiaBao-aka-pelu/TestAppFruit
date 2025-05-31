import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { loadModel, detectFruit } from '../ml/tflite';

import ImagePickerButtons from '../components/ImagePickerButtons';
import ImagePreview from '../components/ImagePreview';
import ResultBox from '../components/ResultBox';
import LoadingIndicator from '../components/LoadingIndicator';

const HomeScreen = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleImageDetection = async (uri: string) => {
    setImageUri(uri);
    setLoading(true);

    try {
      await loadModel();
      const res: any = await detectFruit(uri);
      setResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = () => {
    launchCamera({ mediaType: 'photo', cameraType: 'back' }, async response => {
      if (response.didCancel || response.errorCode) return;
      const uri = response.assets?.[0]?.uri;
      if (uri) await handleImageDetection(uri);
    });
  };

  const handleSelectImage = () => {
    launchImageLibrary({ mediaType: 'photo' }, async response => {
      if (response.didCancel || response.errorCode) return;
      const uri = response.assets?.[0]?.uri;
      if (uri) await handleImageDetection(uri);
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fruit Scanner</Text>

      <ImagePickerButtons
        onCameraPress={handlePickImage}
        onGalleryPress={handleSelectImage}
      />

      {imageUri && <ImagePreview imageUri={imageUri} />}

      {loading && <LoadingIndicator />}

      {results.length > 0 && <ResultBox results={results} />}
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F5F5F5' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
});