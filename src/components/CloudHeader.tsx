import { Image, useWindowDimensions } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

const LIGHT_SOURCE = require('../assets/cloud-header.png');
const DARK_SOURCE = (() => {
  try { return require('../assets/dark-cloud-header.png'); } catch { return LIGHT_SOURCE; }
})();

export default function CloudHeader() {
  const { width } = useWindowDimensions();
  const { isDark } = useAppTheme();
  const source = isDark ? DARK_SOURCE : LIGHT_SOURCE;
  const info = Image.resolveAssetSource(source);
  const height = width * (info.height / info.width);

  return (
    <Image
      source={source}
      style={{ width, height }}
      resizeMode="stretch"
    />
  );
}
