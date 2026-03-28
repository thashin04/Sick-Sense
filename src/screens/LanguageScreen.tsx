import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import IntakeLayout from '../components/IntakeLayout';
import { Colors, FontFamily, FontSize } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Language'>;
};

const LANGUAGES = [
  { id: 'en', flag: '🇺🇸', name: 'English', native: 'English' },
  { id: 'es', flag: '🇪🇸', name: 'Español', native: 'Spanish' },
  { id: 'ht', flag: '🇭🇹', name: 'Kreyòl ayisyen', native: 'Haitian Creole' },
  { id: 'pt', flag: '🇧🇷', name: 'Português', native: 'Portuguese' },
  { id: 'fr', flag: '🇫🇷', name: 'Français', native: 'French' },
  { id: 'zh', flag: '🇨🇳', name: '中文', native: 'Chinese' },
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
            <Text style={styles.flag}>{lang.flag}</Text>
            <View style={styles.labelWrap}>
              <Text style={styles.langName}>{lang.name}</Text>
              <Text style={styles.langNative}>{lang.native}</Text>
            </View>
            {isSelected && (
              <View style={styles.check}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
            )}
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
    borderWidth: 1.5,
    borderColor: Colors.lightMidBlue,
    padding: 14,
    marginBottom: 10,
  },
  cardSelected: {
    borderColor: Colors.darkBlue,
    borderWidth: 2,
  },
  flag: {
    fontSize: 26,
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
