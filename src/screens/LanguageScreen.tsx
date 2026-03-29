import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import IntakeLayout from '../components/IntakeLayout';
import { Colors, FontFamily, FontSize } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Language'>;
};

const LANGUAGES = [
  { id: 'en', code: 'us', name: 'English', native: 'English' },
  { id: 'es', code: 'es', name: 'Español', native: 'Spanish' },
  { id: 'ht', code: 'ht', name: 'Kreyòl ayisyen', native: 'Haitian Creole' },
  { id: 'pt', code: 'br', name: 'Português', native: 'Portuguese' },
  { id: 'fr', code: 'fr', name: 'Français', native: 'French' },
  { id: 'zh', code: 'cn', name: '中文', native: 'Chinese' },
];

export default function LanguageScreen({ navigation }: Props) {
  const [selected, setSelected] = useState('en');
  const [search, setSearch] = useState('');

  const filtered = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.native.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <IntakeLayout
      title="Select your language"
      subtitle="How should we communicate?"
      searchPlaceholder="Search languages..."
      searchValue={search}
      onSearch={setSearch}
      buttonLabel="Continue"
      onButton={() => navigation.navigate('Medicine')}
    >
      {filtered.map((lang) => {
        const isSelected = selected === lang.id;
        return (
          <TouchableOpacity
            key={lang.id}
            style={[styles.card, isSelected && styles.cardSelected]}
            onPress={() => setSelected(lang.id)}
            activeOpacity={0.8}
          >
            <Image 
              source={{ uri: `https://flagcdn.com/w40/${lang.code}.png` }} 
              style={styles.flag} 
              resizeMode="cover"
            />
            <View style={styles.labelWrap}>
              <Text style={styles.langName}>{lang.name}</Text>
              <Text style={styles.langNative}>{lang.native}</Text>
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
