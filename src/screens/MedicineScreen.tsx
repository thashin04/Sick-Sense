import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IntakeLayout from '../components/IntakeLayout';
import { Colors, FontFamily, FontSize } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { useTranslation } from 'react-i18next';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Medicine'>;
};

const MEDICINE_IDS = [
  'dayquil',
  'nyquil',
  'tylenol-cold-flu',
  'mucinex',
  'robitussin',
  'theraflu',
  'claritin',
];

const MAX_SELECT = 4;

export default function MedicineScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const translatedMedicines = MEDICINE_IDS.map((id) => ({
    id,
    name: t(`medicine.items.${id}.name`),
    category: t(`medicine.items.${id}.category`),
  }));

  const filtered = translatedMedicines.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase()),
  );

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, id];
    });
  }

  return (
    <IntakeLayout
      title={t('medicine.title')}
      subtitle={t('medicine.subtitle')}
      searchPlaceholder={t('medicine.search_placeholder')}
      searchValue={search}
      onSearch={setSearch}
      onBack={() => navigation.goBack()}
      buttonLabel={selected.length > 0 ? t('common.continue') : t('common.skip_for_now')}
      onButton={async () => {
        await AsyncStorage.setItem('@pref_medicine', JSON.stringify(selected));
        navigation.navigate('InsuranceProvider');
      }}
    >
      {filtered.map((med) => {
        const isSelected = selected.includes(med.id);
        const isDisabled = !isSelected && selected.length >= MAX_SELECT;
        return (
          <TouchableOpacity
            key={med.id}
            style={[
              styles.card,
              isSelected && styles.cardSelected,
              isDisabled && styles.cardDisabled,
            ]}
            onPress={() => toggle(med.id)}
            activeOpacity={0.8}
            disabled={isDisabled}
          >
            <View style={styles.labelWrap}>
              <Text style={styles.medName}>{med.name}</Text>
              <Text style={styles.medCategory}>{med.category}</Text>
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
    padding: 16,
    marginBottom: 10,
    minHeight: 82,
  },
  cardSelected: {
    borderColor: Colors.darkBlue,
  },
  cardDisabled: {
    opacity: 0.45,
  },
  labelWrap: {
    flex: 1,
  },
  medName: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: '#111827',
  },
  medCategory: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#6B7280',
    marginTop: 3,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.babyBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});
