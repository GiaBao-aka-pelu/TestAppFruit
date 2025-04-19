import React from 'react';
import { ActivityIndicator } from 'react-native-paper';
import { View } from 'react-native';

const LoadingIndicator = () => (
  <View style={{ marginTop: 20 }}>
    <ActivityIndicator animating size="large" />
  </View>
);

export default LoadingIndicator;