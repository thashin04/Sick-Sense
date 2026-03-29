import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageSourcePropType
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
  
  const [preview, setPreview] = useState<ImageSourcePropType | null>(null);

  const SECTIONS = [
    { 
      icon: 'home-outline' as const, 
      title: t('help_modal.dashboard_title'), 
      body: t('help_modal.dashboard_body'),
      media: require('../../assets/help/home.png')
    },
    { 
      icon: 'volume-high-outline' as const, 
      title: t('help_modal.audio_title'), 
      body: t('help_modal.audio_body'),
      media: require('../../assets/help/transcript.png')
    },
    { 
      icon: 'map-outline' as const, 
      title: t('help_modal.risk_title'), 
      body: t('help_modal.risk_body'),
      media: require('../../assets/help/advice-risk-care.png')
    },
    { 
      icon: 'bag-outline' as const, 
      title: t('help_modal.otc_title'), 
      body: t('help_modal.otc_body'),
      media: require('../../assets/help/local-otc.png')
    },
    { 
      icon: 'warning-outline' as const, 
      title: t('help_modal.self_report_title'), 
      body: t('help_modal.self_report_body'),
      media: require('../../assets/help/report-health.png')
    },
    { 
      icon: 'trending-up-outline' as const, 
      title: t('help_modal.map_title'), 
      body: t('help_modal.map_body'),
      media: require('../../assets/help/map.png')
    },
    { 
      icon: 'shield-checkmark-outline' as const, 
      title: t('help_modal.privacy_title'), 
      body: t('help_modal.privacy_body'),
      media: require('../../assets/help/settings.png')
    },
  ];

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
          <View onStartShouldSetResponder={() => true} style={[styles.sheet, { backgroundColor: theme.surfaceModal, shadowColor: theme.shadowColor }]}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.heading }]}>{t('help_modal.title')}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={theme.muted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.headerSub, { color: theme.muted }]}>
              {t('help_modal.subtitle')}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
              {SECTIONS.map((s, i) => (
                <View key={i} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: theme.surfaceSecondary }]}>
                      <Ionicons name={s.icon} size={20} color={theme.isDark ? '#A3C7FF' : Colors.darkBlue} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sectionTitle, { color: theme.body }]}>{s.title}</Text>
                    </View>
                  </View>
                  <Text style={[styles.sectionBody, { color: theme.muted }]}>{s.body}</Text>
                  
                  {s.media && (
                    <TouchableOpacity 
                      activeOpacity={0.8} 
                      style={[styles.mediaWrap, { borderColor: theme.border }]}
                      onPress={() => setPreview(s.media)}
                    >
                      <Image source={s.media} style={styles.mediaImage} />
                      <View style={styles.mediaOverlay}>
                        <Ionicons name="expand" size={18} color="white" />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ------------ Lightbox / Preview Dialog ------------ */}
      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View style={styles.previewBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setPreview(null)} />
          <View style={styles.previewHeaderArea}>
            <TouchableOpacity onPress={() => setPreview(null)} hitSlop={12} style={styles.previewCloseBtn}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>
          {preview && (
            <Image source={preview} style={styles.previewImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </>
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
    height: '85%',
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
  closeBtn: {
    padding: 4,
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
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cloudBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.black,
  },
  sectionBody: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#4B5563',
    lineHeight: 20,
    paddingLeft: 48,
    marginBottom: 12,
  },
  mediaWrap: {
    marginLeft: 48,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mediaOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 6,
    borderRadius: 20,
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewHeaderArea: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  previewCloseBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  previewImage: {
    width: '100%',
    height: '80%',
  },
});
