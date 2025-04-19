import React from 'react';
import { Provider as PaperProvider, IconButton } from 'react-native-paper';
import HomeScreen from './src/screens/HomeScreen';

const App = () => (
  <PaperProvider>
    <HomeScreen />
    {/* Thêm một ví dụ sử dụng IconButton từ react-native-paper */}
    <IconButton
      icon="home"  // tên icon, bạn có thể chọn các icon khác từ Material Community Icons
      onPress={() => console.log('Home pressed')}
    />
  </PaperProvider>
);

export default App;