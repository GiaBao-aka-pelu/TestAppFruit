import Tflite from 'react-native-tflite';

const tflite = new Tflite();

export const loadModel = () =>
  new Promise((resolve, reject) => {
    tflite.loadModel(
      {
        model: 'model.tflite',
        labels: 'labels.txt',
      },
      (err: any, res: unknown) => (err ? reject(err) : resolve(res))
    );
  });

export const detectFruit = (imagePath: string) =>
  new Promise((resolve, reject) => {
    tflite.runModelOnImage(
      {
        path: imagePath,
        imageMean: 127.5,
        imageStd: 127.5,
        numResults: 3,
        threshold: 0.2,
      },
      (err: any, res: unknown) => (err ? reject(err) : resolve(res))
    );
  });
