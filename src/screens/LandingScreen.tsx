import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontFamily, FontSize } from '../theme';
import { RootStackParamList } from '../types/navigation';

const GRAPHIC_SOURCE = require('../assets/landing-graphic.png');
const HILL_SOURCE = (() => {
  try { return require('../assets/landing-hill.png'); } catch { return null; }
})();

/** Returns height/width ratio for a local image source. */
function aspectRatio(source: ReturnType<typeof require>, fallback = 1): number {
  try {
    const info = Image.resolveAssetSource(source);
    return info.height / info.width;
  } catch {
    return fallback;
  }
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Landing'>;
};

export default function LandingScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();

  // Scale each image proportionally to screen width — no crop, no distortion
  const graphicH = width * aspectRatio(GRAPHIC_SOURCE, 844 / 390);
  const hillH    = HILL_SOURCE ? width * aspectRatio(HILL_SOURCE, 0.55) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.indigo }}>
      <StatusBar style="light" />

      {/* 1 — Full Figma graphic, fitted to screen width */}
      <Image
        source={GRAPHIC_SOURCE}
        style={{ position: 'absolute', top: 0, left: 0, width, height: graphicH }}
        resizeMode="stretch"
      />

      {/* 2 — Hill arch overlay on top of the graphic */}
      {HILL_SOURCE && (
        <Image
          source={HILL_SOURCE}
          style={{ position: 'absolute', bottom: 0, left: 0, width, height: hillH }}
          resizeMode="stretch"
        />
      )}

      {/* 3 — Text + buttons anchored to the bottom white area */}
      <View style={styles.content}>
        <View style={styles.spacer} />
        <View style={styles.textBlock}>
          <Text style={styles.title}>Your Sixth Sense for{'\n'}Local Health.</Text>
          <Text style={styles.subtitle}>
            Real-time health intelligence to protect your home and your community.
          </Text>
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.loginBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginTxt}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signupBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('SignUp')}
            >
              <Text style={styles.signupTxt}>Sign up</Text>
            </TouchableOpacity>
          </View>
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
  spacer: {
    flex: 1,
  },
  textBlock: {
    paddingBottom: 52,
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
