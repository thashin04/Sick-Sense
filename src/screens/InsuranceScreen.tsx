import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import IntakeLayout from '../components/IntakeLayout';
import { Colors, FontFamily, FontSize } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { useTranslation } from 'react-i18next';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'InsuranceProvider'>;
};

const PROVIDERS = [
  { id: 'florida-blue', name: 'Florida Blue' },
  { id: 'aetna', name: 'Aetna' },
  { id: 'unitedhealthcare', name: 'UnitedHealthcare' },
  { id: 'cigna', name: 'Cigna' },
  { id: 'humana', name: 'Humana' },
  { id: 'medicaid', name: 'Medicaid' },
  { id: 'medicare', name: 'Medicare' },
  { id: 'ambetter', name: 'Ambetter' },
  { id: 'molina', name: 'Molina Healthcare' },
  { id: 'wellcare', name: 'WellCare' },
  { id: 'none', name: 'No Insurance / Self-Pay' },
];

export default function InsuranceScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const translatedProviders = PROVIDERS.map(p => ({
    ...p,
    name: p.id === 'none' ? t('insurance.items.none') : p.name
  }));

  const filtered = translatedProviders.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <IntakeLayout
      title={t('insurance.title')}
      subtitle={t('insurance.subtitle')}
      searchPlaceholder={t('insurance.search_placeholder')}
      searchValue={search}
      onSearch={setSearch}
      onBack={() => navigation.goBack()}
      buttonLabel={selected !== null ? t('common.continue') : t('common.skip_for_now')}
      onButton={() => navigation.navigate('Tutorial')}
    >
      {filtered.map((provider) => {
        const isSelected = selected === provider.id;
        return (
          <TouchableOpacity
            key={provider.id}
            style={[styles.card, isSelected && styles.cardSelected]}
            onPress={() => setSelected(isSelected ? null : provider.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.providerName}>{provider.name}</Text>
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
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 10,
    minHeight: 64,
  },
  cardSelected: {
    borderColor: Colors.darkBlue,
  },
  providerName: {
    flex: 1,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: '#111827',
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
