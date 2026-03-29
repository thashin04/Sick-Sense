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
import { useAppTheme } from '../hooks/useAppTheme';

const LIGHT_GRAPHIC = require('../assets/landing-graphic.png');
const DARK_GRAPHIC = require('../assets/dark-landing-graphic.png');
const LIGHT_HILL = require('../assets/landing-hill.png');
const DARK_HILL = require('../assets/dark-landing-hill.png');

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
  const { isDark } = useAppTheme();

  const graphic = isDark ? DARK_GRAPHIC : LIGHT_GRAPHIC;
  const hill    = isDark ? DARK_HILL    : LIGHT_HILL;

  const graphicH = width * aspectRatio(graphic, 844 / 390);
  const hillH    = hill ? width * aspectRatio(hill, 0.55) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.indigo }}>
      <StatusBar style="light" />

      <Image
        source={graphic}
        style={{ position: 'absolute', top: 0, left: 0, width, height: graphicH }}
        resizeMode="stretch"
      />

      {hill && (
        <Image
          source={hill}
          style={{ position: 'absolute', bottom: 0, left: 0, width, height: hillH }}
          resizeMode="stretch"
        />
      )}

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
  spacer: { flex: 1 },
  textBlock: { paddingBottom: 52 },
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: 34,
    color: '#FFFFFF',
    lineHeight: 42,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: '#A3C7FF',
    lineHeight: 22,
    marginBottom: 32,
  },
  buttons: { gap: 12 },
  loginBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 17,
    borderRadius: 50,
    alignItems: 'center',
  },
  loginTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: Colors.indigo,
  },
  signupBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 17,
    borderRadius: 50,
    alignItems: 'center',
  },
  signupTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: '#FFFFFF',
  },
});
