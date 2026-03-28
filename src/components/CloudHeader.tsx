import { useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../theme';

interface Props {
  height?: number;
}

function cloudLayerPath(
  svgW: number,
  svgH: number,
  baseY: number,
  bumpH: number,
  numBumps: number,
): string {
  const bw = svgW / numBumps;
  let d = `M 0 ${svgH} L ${svgW} ${svgH} L ${svgW} ${baseY}`;
  for (let i = numBumps; i > 0; i--) {
    const lx = (i - 1) * bw;
    const px = lx + bw / 2;
    d += ` Q ${px} ${baseY - bumpH} ${lx} ${baseY}`;
  }
  d += ' Z';
  return d;
}

export default function CloudHeader({ height = 160 }: Props) {
  const { width } = useWindowDimensions();
  const cloudSvgH = height * 0.55;

  return (
    <LinearGradient
      colors={[Colors.indigo, '#2244B0']}
      style={{ height, overflow: 'visible' }}
    >
      <Svg
        width={width}
        height={cloudSvgH}
        style={{ position: 'absolute', bottom: -cloudSvgH * 0.08, left: 0 }}
      >
        {/* Mid-blue layer */}
        <Path
          d={cloudLayerPath(width, cloudSvgH, cloudSvgH * 0.5, 40, 4)}
          fill={Colors.babyBlue}
          opacity={0.6}
        />
        {/* Light layer */}
        <Path
          d={cloudLayerPath(width, cloudSvgH, cloudSvgH * 0.78, 36, 5)}
          fill={Colors.lightMidBlue}
        />
        {/* White layer — bleeds slightly below header */}
        <Path
          d={cloudLayerPath(width, cloudSvgH, cloudSvgH, 34, 4)}
          fill={Colors.cloudBlue}
        />
      </Svg>
    </LinearGradient>
  );
}
