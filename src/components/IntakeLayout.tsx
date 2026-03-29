import { ReactNode } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import CloudHeader from './CloudHeader';
import { Colors, FontFamily, FontSize } from '../theme';
import { useTranslation } from 'react-i18next';

interface Props {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearch: (text: string) => void;
  onBack?: () => void;
  buttonLabel: string;
  onButton: () => void;
  children: ReactNode;
}

export default function IntakeLayout({
  title,
  subtitle,
  searchPlaceholder,
  searchValue,
  onSearch,
  onBack,
  buttonLabel,
  onButton,
  children,
}: Props) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar style="light" />

      {/* ── Sticky header ── */}
      <CloudHeader />

      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.back} onPress={onBack} hitSlop={12}>
            <Ionicons name="chevron-back" size={18} color={Colors.darkBlue} />
            <Text style={styles.backTxt}>{t('common.back')}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            value={searchValue}
            onChangeText={onSearch}
            placeholderTextColor="#9CA3AF"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* ── Scrollable list ── */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      {/* ── Fixed button ── */}
      <View style={styles.btnWrap}>
        <TouchableOpacity style={styles.btn} onPress={onButton} activeOpacity={0.85}>
          <Text style={styles.btnTxt}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cloudBlue },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.darkBlue,
  },
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: 30,
    color: Colors.darkBlue,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#6B7280',
    marginBottom: 18,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    shadowColor: '#1E1C61',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: '#111827',
  },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  btnWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: Colors.cloudBlue,
  },
  btn: {
    backgroundColor: Colors.indigo,
    paddingVertical: 17,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: Colors.indigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: '#FFFFFF',
  },
});
