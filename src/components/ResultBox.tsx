import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

type Props = {
  results: { label: string; confidence: number }[];
};

const ResultBox = ({ results }: Props) => (
  <View style={styles.results}>
    <Text style={styles.subtitle}>Kết quả:</Text>
    {results.map((item, index) => (
      <Text key={index}>
        {item.label} - {(item.confidence * 100).toFixed(2)}%
      </Text>
    ))}
  </View>
);

export default ResultBox;

const styles = StyleSheet.create({
  results: { marginTop: 20 },
  subtitle: { fontSize: 18, marginTop: 20, fontWeight: '600' },
});