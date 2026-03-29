import { Image, useWindowDimensions } from 'react-native';

const SOURCE = require('../assets/cloud-header.png');

export default function CloudHeader() {
  const { width } = useWindowDimensions();
  const info = Image.resolveAssetSource(SOURCE);
  const height = width * (info.height / info.width);

  return (
    <Image
      source={SOURCE}
      style={{ width, height }}
      resizeMode="stretch"
    />
  );
}
