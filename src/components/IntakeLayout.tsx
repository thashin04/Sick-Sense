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
import { useAppTheme } from '../hooks/useAppTheme';

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
  const theme = useAppTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['bottom']}>
      <StatusBar style={theme.statusBar} />

      {/* ── Sticky header ── */}
      <CloudHeader />

      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.back} onPress={onBack} hitSlop={12}>
            <Ionicons name="chevron-back" size={18} color={theme.heading} />
            <Text style={[styles.backTxt, { color: theme.heading }]}>{t('common.back')}</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.title, { color: theme.heading }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text>

        <View style={[styles.searchWrap, { backgroundColor: theme.surface, shadowColor: theme.shadowColor }]}>
          <Ionicons name="search" size={16} color={theme.muted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.body }]}
            placeholder={searchPlaceholder}
            value={searchValue}
            onChangeText={onSearch}
            placeholderTextColor={theme.muted}
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
      <View style={[styles.btnWrap, { backgroundColor: theme.background }]}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary, shadowColor: theme.primary }]} onPress={onButton} activeOpacity={0.85}>
          <Text style={[styles.btnTxt, { color: theme.primaryText }]}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
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
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
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
  },
  btn: {
    paddingVertical: 17,
    borderRadius: 50,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
  },
});
