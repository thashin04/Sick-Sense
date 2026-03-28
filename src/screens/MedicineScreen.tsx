import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import IntakeLayout from '../components/IntakeLayout';
import { Colors, FontFamily, FontSize } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Medicine'>;
};

const MEDICINES = [
  { id: 'acetaminophen', name: 'Acetaminophen', category: 'Pain Relief' },
  { id: 'ibuprofen', name: 'Ibuprofen', category: 'Pain Relief / Anti-inflammatory' },
  { id: 'aspirin', name: 'Aspirin', category: 'Pain Relief / Blood Thinner' },
  { id: 'antihistamines', name: 'Antihistamines', category: 'Allergy Relief' },
  { id: 'cough-syrup', name: 'Cough Syrup', category: 'Cold & Cough Relief' },
  { id: 'decongestant', name: 'Decongestant', category: 'Nasal / Sinus Relief' },
  { id: 'antacid', name: 'Antacid', category: 'Digestive Relief' },
  { id: 'vitamins', name: 'Vitamins / Supplements', category: 'Immune Support' },
  { id: 'throat-lozenges', name: 'Throat Lozenges', category: 'Sore Throat Relief' },
];

const MAX_SELECT = 4;

export default function MedicineScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const filtered = MEDICINES.filter(
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
      title="Medicine Preferences"
      subtitle={`Select up to ${MAX_SELECT} OTC medicines you use (optional)`}
      searchPlaceholder="Search medicines..."
      searchValue={search}
      onSearch={setSearch}
      onBack={() => navigation.goBack()}
      buttonLabel="Skip for now"
      onButton={() => navigation.navigate('InsuranceProvider')}
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
    padding: 16,
    marginBottom: 10,
  },
  cardSelected: {
    borderColor: Colors.darkBlue,
    borderWidth: 2,
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
