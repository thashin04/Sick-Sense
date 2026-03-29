import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, FontFamily, FontSize } from '../../theme';
import { useAppTheme } from '../../hooks/useAppTheme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function HelpModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const SECTIONS = [
    { icon: 'home-outline' as const, title: t('help_modal.dashboard_title'), body: t('help_modal.dashboard_body') },
    { icon: 'volume-high-outline' as const, title: t('help_modal.audio_title'), body: t('help_modal.audio_body') },
    { icon: 'map-outline' as const, title: t('help_modal.risk_title'), body: t('help_modal.risk_body') },
    { icon: 'bag-outline' as const, title: t('help_modal.otc_title'), body: t('help_modal.otc_body') },
    { icon: 'warning-outline' as const, title: t('help_modal.self_report_title'), body: t('help_modal.self_report_body') },
    { icon: 'trending-up-outline' as const, title: t('help_modal.map_title'), body: t('help_modal.map_body') },
    { icon: 'shield-checkmark-outline' as const, title: t('help_modal.privacy_title'), body: t('help_modal.privacy_body') },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: theme.surfaceModal, shadowColor: theme.shadowColor }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.heading }]}>{t('help_modal.title')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={theme.muted} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.headerSub, { color: theme.muted }]}>
            {t('help_modal.subtitle')}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
            {SECTIONS.map((s, i) => (
              <View key={i} style={styles.section}>
                <View style={[styles.sectionIconWrap, { backgroundColor: theme.surfaceSecondary }]}>
                  <Ionicons name={s.icon} size={20} color={theme.isDark ? '#A3C7FF' : Colors.darkBlue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, { color: theme.body }]}>{s.title}</Text>
                  <Text style={[styles.sectionBody, { color: theme.muted }]}>{s.body}</Text>
                </View>
              </View>
            ))}
            <View style={{ height: 32 }} />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
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
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '88%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.lightMidBlue,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize.xl,
    color: Colors.indigo,
  },
  headerSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#6B7280',
    marginBottom: 20,
  },
  body: {
    flex: 1,
  },
  section: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 22,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cloudBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.black,
    marginBottom: 4,
  },
  sectionBody: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#4B5563',
    lineHeight: 20,
  },
});
