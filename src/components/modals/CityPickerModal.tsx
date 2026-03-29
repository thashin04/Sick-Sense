import { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../../context/LocationContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Colors, FontFamily, FontSize } from '../../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const ALLOWED_CITIES = [
  { id: 'Tallahassee', label: 'Tallahassee, FL' },
  { id: 'Gainesville', label: 'Gainesville, FL' },
  { id: 'Jacksonville', label: 'Jacksonville, FL' },
  { id: 'Tampa', label: 'Tampa, FL' },
  { id: 'Orlando', label: 'Orlando, FL' },
  { id: 'Miami', label: 'Miami, FL' },
  { id: 'Fort Lauderdale', label: 'Fort Lauderdale, FL' },
];

export default function CityPickerModal({ visible, onClose }: Props) {
  const theme = useAppTheme();
  const { selectedCity, setSelectedCity } = useLocation();
  const [search, setSearch] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(backdropOpacity, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const filtered = ALLOWED_CITIES.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase()),
  );

  function handleSelectCity(cityId: string) {
    setSelectedCity(cityId);
    setSearch('');
    onClose();
  }

  function handleClose() {
    setSearch('');
    onClose();
  }

  async function handleCurrentCity() {
    setLoadingLocation(true);
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      const detectedCity: string = data.city ?? '';

      const match = ALLOWED_CITIES.find(
        (c) => c.id.toLowerCase() === detectedCity.toLowerCase(),
      );

      if (match) {
        handleSelectCity(match.id);
      } else {
        Alert.alert(
          'City Not Supported',
          `"${detectedCity}" is not currently supported. Please select a city from the list.`,
        );
      }
    } catch {
      Alert.alert('Error', 'Could not detect your location. Please select a city manually.');
    } finally {
      setLoadingLocation(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <SafeAreaView style={styles.safe} edges={['bottom']}>

            {/* ── Header ── */}
            <View style={[styles.header, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.headerTitle, { color: theme.heading }]}>Choose City</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={12}>
                <Ionicons name="close" size={22} color={theme.heading} />
              </TouchableOpacity>
            </View>

            {/* ── Current Location Button ── */}
            <TouchableOpacity
              style={[styles.currentBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              activeOpacity={0.7}
              onPress={handleCurrentCity}
              disabled={loadingLocation}
            >
              <View style={[styles.currentIcon, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : Colors.cloudBlue }]}>
                <Ionicons
                  name={loadingLocation ? 'hourglass-outline' : 'navigate'}
                  size={18}
                  color={Colors.babyBlue}
                />
              </View>
              <Text style={[styles.currentTxt, { color: theme.heading }]}>
                {loadingLocation ? 'Detecting location…' : 'Use Current City'}
              </Text>
              {!loadingLocation && (
                <Ionicons name="chevron-forward" size={16} color={theme.muted} />
              )}
            </TouchableOpacity>

            {/* ── Search ── */}
            <View style={[styles.searchWrap, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
              <Ionicons name="search" size={18} color={theme.muted} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: theme.heading }]}
                placeholder="Search city…"
                placeholderTextColor={theme.muted}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                autoCapitalize="words"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={theme.muted} />
                </TouchableOpacity>
              )}
            </View>

            {/* ── City List ── */}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedCity;
                return (
                  <TouchableOpacity
                    style={[styles.row, { borderBottomColor: theme.divider }]}
                    activeOpacity={0.7}
                    onPress={() => handleSelectCity(item.id)}
                  >
                    <View style={[styles.rowIcon, { backgroundColor: isSelected ? Colors.babyBlue : (theme.isDark ? 'rgba(255,255,255,0.1)' : Colors.cloudBlue) }]}>
                      <Ionicons name="location" size={18} color={isSelected ? Colors.white : theme.muted} />
                    </View>
                    <Text style={[styles.rowLabel, { color: theme.heading, flex: 1 }]}>{item.label}</Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color={Colors.babyBlue} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={[styles.emptyTxt, { color: theme.muted }]}>No cities match your search.</Text>
              }
            />
          </SafeAreaView>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize.lg,
  },
  currentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  currentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentTxt: {
    flex: 1,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 50,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    padding: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
  },
  emptyTxt: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginTop: 32,
  },
});
