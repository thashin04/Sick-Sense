import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Ellipse, G } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontFamily, FontSize } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Landing'>;
};

// A cloud layer: flat bottom, bumpy top edge (bumps point upward)
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

// ── Illustration sub-components ──────────────────────────────────────────────

function MapPin({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  const r = size * 0.42;
  const tipY = cy + size * 0.88;

  return (
    <G>
      {/* Teardrop body */}
      <Path
        d={`
          M ${cx} ${tipY}
          C ${cx - r * 0.3} ${tipY - size * 0.3} ${cx - r} ${cy + r * 0.5} ${cx - r} ${cy}
          A ${r} ${r} 0 1 1 ${cx + r} ${cy}
          C ${cx + r} ${cy + r * 0.5} ${cx + r * 0.3} ${tipY - size * 0.3} ${cx} ${tipY}
          Z
        `}
        fill={Colors.sunlight}
      />
      {/* White inner circle */}
      <Circle cx={cx} cy={cy} r={r * 0.72} fill="white" />
      {/* Medical cross — horizontal */}
      <Rect
        x={cx - r * 0.38}
        y={cy - r * 0.13}
        width={r * 0.76}
        height={r * 0.26}
        rx={3}
        fill={Colors.darkBlue}
      />
      {/* Medical cross — vertical */}
      <Rect
        x={cx - r * 0.13}
        y={cy - r * 0.38}
        width={r * 0.26}
        height={r * 0.76}
        rx={3}
        fill={Colors.darkBlue}
      />
    </G>
  );
}

function Tree({ cx, groundY, color }: { cx: number; groundY: number; color: string }) {
  const foliageR = 26;
  const trunkH = 24;
  const trunkW = 7;

  return (
    <G>
      <Rect
        x={cx - trunkW / 2}
        y={groundY - trunkH}
        width={trunkW}
        height={trunkH}
        fill="#8B7355"
      />
      <Circle
        cx={cx}
        cy={groundY - trunkH - foliageR * 0.75}
        r={foliageR}
        fill={color}
      />
    </G>
  );
}

function House({ cx, groundY }: { cx: number; groundY: number }) {
  const bW = 116;
  const bH = 76;
  const rW = 148;
  const rH = 62;
  const dW = 30;
  const dH = 50;
  const wW = 22;
  const wH = 20;
  const bx = cx - bW / 2;
  const by = groundY - bH;

  return (
    <G>
      {/* Body */}
      <Rect x={bx} y={by} width={bW} height={bH} fill="white" />

      {/* Chimney — behind roof */}
      <Rect x={cx + 22} y={by - rH + 10} width={14} height={26} fill={Colors.coral} />

      {/* Roof */}
      <Path
        d={`M ${cx - rW / 2} ${by} L ${cx} ${by - rH} L ${cx + rW / 2} ${by} Z`}
        fill={Colors.coral}
      />

      {/* Door with arched top */}
      <Path
        d={`
          M ${cx - dW / 2} ${groundY}
          L ${cx - dW / 2} ${groundY - dH + dW / 2}
          A ${dW / 2} ${dW / 2} 0 0 1 ${cx + dW / 2} ${groundY - dH + dW / 2}
          L ${cx + dW / 2} ${groundY}
          Z
        `}
        fill={Colors.darkBlue}
      />

      {/* Left window */}
      <Rect x={bx + 12} y={by + 16} width={wW} height={wH} rx={3} fill={Colors.lightMidBlue} />

      {/* Right window */}
      <Rect
        x={bx + bW - 12 - wW}
        y={by + 16}
        width={wW}
        height={wH}
        rx={3}
        fill={Colors.lightMidBlue}
      />
    </G>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function LandingScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();

  const skyH = height * 0.52;
  const cloudSvgH = 220;
  // Slide the cloud SVG up so its bottom ~55px bleed below the sky gradient
  const cloudSvgTop = skyH - cloudSvgH + 55;

  // Illustration
  const illH = 320;
  const illTop = height * 0.22;
  const groundY = illH * 0.81; // ~259
  const pinCY = illH * 0.10;   // ~32 — pin circle center
  const cx = width / 2;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cloudBlue }}>
      <StatusBar style="light" />

      {/* Sky gradient */}
      <LinearGradient
        colors={[Colors.indigo, '#2244B0']}
        style={{ height: skyH, position: 'absolute', top: 0, left: 0, right: 0 }}
      />

      {/* Layered clouds */}
      <Svg
        width={width}
        height={cloudSvgH}
        style={{ position: 'absolute', top: cloudSvgTop, left: 0 }}
      >
        <Path
          d={cloudLayerPath(width, cloudSvgH, cloudSvgH * 0.28, 44, 4)}
          fill="#3A5CC4"
        />
        <Path
          d={cloudLayerPath(width, cloudSvgH, cloudSvgH * 0.52, 40, 5)}
          fill={Colors.babyBlue}
        />
        <Path
          d={cloudLayerPath(width, cloudSvgH, cloudSvgH * 0.74, 36, 4)}
          fill={Colors.lightMidBlue}
        />
        <Path
          d={cloudLayerPath(width, cloudSvgH, cloudSvgH * 0.94, 32, 5)}
          fill={Colors.cloudBlue}
        />
      </Svg>

      {/* Illustration — overlaps sky and content */}
      <Svg
        width={width}
        height={illH}
        style={{ position: 'absolute', top: illTop, left: 0 }}
      >
        {/* White hill/mound behind house */}
        <Ellipse
          cx={cx}
          cy={groundY + 40}
          rx={width * 0.56}
          ry={78}
          fill="white"
        />

        {/* Left tree (orange) */}
        <Tree cx={cx - 125} groundY={groundY} color="#E88030" />

        {/* Right tree (blue) */}
        <Tree cx={cx + 128} groundY={groundY} color={Colors.babyBlue} />

        {/* House */}
        <House cx={cx} groundY={groundY} />

        {/* Map pin */}
        <MapPin cx={cx - 8} cy={pinCY} size={90} />
      </Svg>

      {/* Text + buttons — pushed below illustration */}
      <View style={[styles.content, { paddingTop: skyH + 85 }]}>
        <Text style={styles.title}>Your Sixth Sense for{'\n'}Local Health.</Text>
        <Text style={styles.subtitle}>
          Real-time health intelligence to protect your home and your community.
        </Text>
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.loginBtn} activeOpacity={0.85} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginTxt}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signupBtn} activeOpacity={0.85} onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signupTxt}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 26,
  },
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: 34,
    color: Colors.darkBlue,
    lineHeight: 42,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.indigo,
    lineHeight: 22,
    marginBottom: 32,
  },
  buttons: {
    gap: 12,
  },
  loginBtn: {
    backgroundColor: Colors.indigo,
    paddingVertical: 17,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: Colors.indigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: '#FFFFFF',
  },
  signupBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 17,
    borderRadius: 50,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.lightMidBlue,
  },
  signupTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: Colors.babyBlue,
  },
});
