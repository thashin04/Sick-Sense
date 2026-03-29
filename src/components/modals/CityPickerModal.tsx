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

export default function CityPickerModal({ visible, onClose }: Props) {
  const theme = useAppTheme();
  const { selectedCity, savedCities, setSelectedCity, removeCity } = useLocation();
  const [search, setSearch] = useState('');
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(backdropOpacity, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const trimmed = search.trim();

  function handleSelectCity(city: string) {
    setSelectedCity(city);
    onClose();
  }

  function handleAddSearch() {
    if (!trimmed) return;
    setSelectedCity(trimmed);
    setSearch('');
    onClose();
  }

  function handleClose() {
    setSearch('');
    onClose();
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

          {/* ── Search ── */}
          <View style={[styles.searchWrap, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
            <Ionicons name="search" size={18} color={theme.muted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: theme.heading }]}
              placeholder="e.g. Tampa, FL"
              placeholderTextColor={theme.muted}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleAddSearch}
            />
            {trimmed.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={theme.muted} />
              </TouchableOpacity>
            )}
          </View>

          {/* ── Add from search ── */}
          {trimmed.length > 0 && (
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: theme.divider }]}
              activeOpacity={0.7}
              onPress={handleAddSearch}
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : Colors.cloudBlue }]}>
                <Ionicons name="add" size={18} color={Colors.babyBlue} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.heading }]}>
                Use "<Text style={{ color: Colors.babyBlue }}>{trimmed}</Text>"
              </Text>
            </TouchableOpacity>
          )}

          {/* ── Saved cities ── */}
          {savedCities.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: theme.muted }]}>SAVED CITIES</Text>
              <FlatList
                data={savedCities}
                keyExtractor={item => item}
                renderItem={({ item }) => {
                  const isSelected = item === selectedCity;
                  return (
                    <TouchableOpacity
                      style={[styles.row, { borderBottomColor: theme.divider }]}
                      activeOpacity={0.7}
                      onPress={() => handleSelectCity(item)}
                    >
                      <View style={[styles.rowIcon, { backgroundColor: isSelected ? Colors.babyBlue : (theme.isDark ? 'rgba(255,255,255,0.1)' : Colors.cloudBlue) }]}>
                        <Ionicons name="location" size={18} color={isSelected ? Colors.white : theme.muted} />
                      </View>
                      <Text style={[styles.rowLabel, { color: theme.heading, flex: 1 }]}>{item}</Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={18} color={Colors.babyBlue} style={{ marginRight: 8 }} />
                      )}
                      {!isSelected && (
                        <TouchableOpacity onPress={() => removeCity(item)} hitSlop={12}>
                          <Ionicons name="trash-outline" size={16} color={theme.muted} />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </>
          )}
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
  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 4,
  },
});
