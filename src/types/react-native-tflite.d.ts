declare module 'react-native-tflite' {
    export interface LoadModelParams {
      model: string;
      labels: string;
    }
  
    export interface RunModelOnImageParams {
      path: string;
      imageMean: number;
      imageStd: number;
      numResults: number;
      threshold: number;
    }
  
    export interface Result {
      label: string;
      confidence: number;
    }
  
    interface Tflite {
      loadModel(
        params: LoadModelParams,
        callback: (err: any, res: any) => void
      ): void;
      
      runModelOnImage(
        params: RunModelOnImageParams,
        callback: (err: any, results: Result[]) => void
      ): void;
    }
  
    const Tflite: Tflite;
    export default Tflite;
  }  
  