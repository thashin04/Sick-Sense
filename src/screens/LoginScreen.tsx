import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontAwesome } from '@expo/vector-icons';
import CloudHeader from '../components/CloudHeader';
import GoogleIcon from '../components/GoogleIcon';
import { Colors, FontFamily, FontSize } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header scrolls with content */}
          <CloudHeader />

          <View style={styles.body}>
            <Text style={styles.title}>Log In</Text>
            <Text style={styles.subtitle}>Welcome to SickSense!</Text>

            <View style={styles.card}>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
                <GoogleIcon size={20} />
                <Text style={styles.socialTxt}>Login with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
                <FontAwesome name="apple" size={22} color="#000" />
                <Text style={styles.socialTxt}>Login with Apple</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerTxt}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#B0B8C8"
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholderTextColor="#B0B8C8"
              />

              <TouchableOpacity style={styles.forgotWrap}>
                <Text style={styles.forgotTxt}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85}>
                <Text style={styles.primaryTxt}>Login</Text>
              </TouchableOpacity>

              <View style={styles.footerRow}>
                <Text style={styles.footerTxt}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                  <Text style={styles.linkTxt}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cloudBlue },
  flex: { flex: 1 },
  scroll: { paddingBottom: 32 },
  body: { paddingHorizontal: 20, paddingTop: 20 },
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: 36,
    color: Colors.darkBlue,
    textAlign: 'center',
    marginTop: 28,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    shadowColor: '#1E1C61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.darkBlue,
    borderRadius: 50,
    paddingVertical: 14,
    marginBottom: 12,
  },
  socialTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: '#111827',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerTxt: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#6B7280',
    marginHorizontal: 12,
  },
  label: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.lightMidBlue,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: '#111827',
    backgroundColor: '#FAFBFF',
    marginBottom: 16,
  },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 },
  forgotTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.babyBlue,
    textDecorationLine: 'underline',
  },
  primaryBtn: {
    backgroundColor: Colors.indigo,
    paddingVertical: 17,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.indigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: '#FFFFFF',
  },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerTxt: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: '#111827',
  },
  linkTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.babyBlue,
    textDecorationLine: 'underline',
  },
});
