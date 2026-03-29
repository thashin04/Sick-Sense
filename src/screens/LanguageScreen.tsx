import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IntakeLayout from '../components/IntakeLayout';
import { Colors, FontFamily, FontSize } from '../theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { RootStackParamList } from '../types/navigation';
import { useTranslation } from 'react-i18next';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Language'>;
  route: RouteProp<RootStackParamList, 'Language'>;
};

const LANGUAGES = [
  { id: 'en', code: 'us', name: 'English', native: 'English' },
  { id: 'es', code: 'es', name: 'Español', native: 'Spanish' },
  { id: 'ht', code: 'ht', name: 'Kreyòl ayisyen', native: 'Haitian Creole' },
  { id: 'pt', code: 'br', name: 'Português', native: 'Portuguese' },
  { id: 'fr', code: 'fr', name: 'Français', native: 'French' },
  { id: 'zh', code: 'cn', name: '中文', native: 'Chinese' },
];

export default function LanguageScreen({ navigation, route }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
  const fromOnboarding = route.params?.fromOnboarding ?? false;
  const [selected, setSelected] = useState(() => {
    const lang = i18n.language || 'en';
    return lang.substring(0, 2);
  });
  const [search, setSearch] = useState('');
  const [userAuth, setUserAuth] = useState<{ uid: string } | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const auth = await AsyncStorage.getItem('@user_auth');
      if (auth) setUserAuth(JSON.parse(auth));
    }
    checkAuth();
  }, []);

  const filtered = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.native.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <IntakeLayout
      title={t('language.title')}
      subtitle={t('language.subtitle')}
      searchPlaceholder={t('language.search_placeholder')}
      searchValue={search}
      onSearch={setSearch}
      buttonLabel={userAuth && !fromOnboarding ? (t('common.save_close') || 'Save & Close') : t('common.continue')}
      onButton={async () => {
        await AsyncStorage.setItem('@pref_language', selected);

        // Sync to backend if logged in
        if (userAuth?.uid) {
          try {
            await fetch('http://localhost:8000/api/user/preferences', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ uid: userAuth.uid, language: selected }),
            });
          } catch (e) {
            console.error('Failed to sync language to backend', e);
          }
        }

        if (fromOnboarding) {
          navigation.navigate('Medicine');
        } else if (userAuth?.uid) {
          navigation.goBack();
        } else {
          navigation.navigate('Medicine');
        }
      }}
    >
      {filtered.map((lang) => {
        const isSelected = selected === lang.id;
        return (
          <TouchableOpacity
            key={lang.id}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: isSelected ? theme.primary : theme.border }]}
            onPress={() => {
              setSelected(lang.id);
              i18n.changeLanguage(lang.id);
            }}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: `https://flagcdn.com/w40/${lang.code}.png` }}
              style={styles.flag}
              resizeMode="cover"
            />
            <View style={styles.labelWrap}>
              <Text style={[styles.langName, { color: theme.body }]}>{lang.name}</Text>
              <Text style={[styles.langNative, { color: theme.muted }]}>{lang.native}</Text>
            </View>
            <View style={[styles.check, !isSelected && { backgroundColor: 'transparent' }]}>
              {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>
        );
      })}
    </IntakeLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.lightMidBlue,
    padding: 14,
    marginBottom: 10,
    minHeight: 72,
  },
  cardSelected: {
    borderColor: Colors.darkBlue,
  },
  flag: {
    width: 32,
    height: 24,
    borderRadius: 3,
    marginRight: 14,
  },
  labelWrap: {
    flex: 1,
  },
  langName: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: '#111827',
  },
  langNative: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#6B7280',
    marginTop: 2,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.babyBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
