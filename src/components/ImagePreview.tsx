import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';

type Props = {
  imageUri: string;
};

const ImagePreview = ({ imageUri }: Props) => (
  <Card style={styles.card}>
    <Image source={{ uri: imageUri }} style={styles.image} />
  </Card>
);

export default ImagePreview;

const styles = StyleSheet.create({
  card: { marginTop: 20, borderRadius: 16 },
  image: { width: '100%', height: 300, borderRadius: 16 },
});