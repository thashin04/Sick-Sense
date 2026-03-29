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
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signupUser } from '../api/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import CloudHeader from '../components/CloudHeader';
import GoogleIcon from '../components/GoogleIcon';
import { Colors, FontFamily, FontSize } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { useAppTheme } from '../hooks/useAppTheme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SignUp'>;
};

export default function SignUpScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all details.');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Passwords Mismatch', 'Your passwords do not match. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await signupUser(email, password, name);
      // Save backend user reference
      await AsyncStorage.setItem('@user_auth', JSON.stringify(response.user));
      navigation.navigate('Language', { fromOnboarding: true });
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['bottom']}>
      <StatusBar style={theme.statusBar} />
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
            <Text style={[styles.title, { color: theme.heading }]}>Sign Up</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>Join SickSense!</Text>

            <View style={[styles.card, { backgroundColor: theme.surfaceModal, shadowColor: theme.shadowColor }]}>
              <TouchableOpacity style={[styles.socialBtn, { borderColor: theme.border }]} activeOpacity={0.8}>
                <GoogleIcon size={20} />
                <Text style={[styles.socialTxt, { color: theme.heading }]}>Sign up with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.socialBtn, { borderColor: theme.border }]} activeOpacity={0.8}>
                <FontAwesome name="apple" size={22} color={theme.heading} />
                <Text style={[styles.socialTxt, { color: theme.heading }]}>Sign up with Apple</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerTxt}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={[styles.label, { color: theme.labelText }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                placeholderTextColor={theme.placeholderColor}
              />

              <Text style={[styles.label, { color: theme.labelText }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={theme.placeholderColor}
              />

              <Text style={[styles.label, { color: theme.labelText }]}>Password</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={[styles.input, styles.inputWithIcon, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  placeholderTextColor={theme.placeholderColor}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)} hitSlop={8}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={theme.placeholderColor} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: theme.labelText }]}>Confirm Password</Text>
              <View style={[styles.inputWrap, { marginBottom: 24 }]}>
                <TextInput
                  style={[styles.input, styles.inputWithIcon, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  placeholderTextColor={theme.placeholderColor}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword(v => !v)} hitSlop={8}>
                  <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={theme.placeholderColor} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
                activeOpacity={0.85}
                onPress={handleSignup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.primaryText} />
                ) : (
                  <Text style={[styles.primaryTxt, { color: theme.primaryText }]}>Sign Up</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footerRow}>
                <Text style={[styles.footerTxt, { color: theme.body }]}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.linkTxt}>Log in</Text>
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
  safe: { flex: 1 },
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
  inputWrap: { marginBottom: 16 },
  inputWithIcon: { marginBottom: 0, paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  primaryBtn: {
    paddingVertical: 17,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
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
