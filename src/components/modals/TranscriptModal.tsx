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
  /** Transcript text — will come from backend TTS response */
  transcript: string;
  duration: string;
}

export default function TranscriptModal({ visible, onClose, transcript, duration }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  console.log('[TranscriptModal] Rendering. Transcript length:', transcript?.length, 'Visible:', visible);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.surfaceModal, shadowColor: theme.shadowColor }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.heading }]}>{t('transcript_modal.title')}</Text>
              <Text style={[styles.meta, { color: theme.muted }]}>{t('transcript_modal.meta', { duration })}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={theme.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={true}
            style={styles.body}
          >
            <Text style={[styles.transcriptText, { color: theme.body }]}>
              {transcript && transcript.trim() ? transcript.trim() : "The daily health report transcript is currently being generated. Please check back in a few moments."}
            </Text>
          </ScrollView>
        </View>
      </View>
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
    height: '60%', // Fixed height instead of maxHeight for debugging layout issues
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
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize.xl,
    color: Colors.indigo,
    marginBottom: 2,
  },
  meta: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#6B7280',
  },
  body: {
    flex: 1,
  },
  transcriptText: {
    fontSize: FontSize.md,
    color: Colors.indigo, // Use a more brand-compliant dark color
    lineHeight: 24,
    paddingBottom: 40,
  },
});
