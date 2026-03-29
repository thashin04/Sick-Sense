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

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Transcript text — will come from backend TTS response */
  transcript: string;
  duration: string;
}

export default function TranscriptModal({ visible, onClose, transcript, duration }: Props) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t('transcript_modal.title')}</Text>
              <Text style={styles.meta}>{t('transcript_modal.meta', { duration })}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
            <Text style={styles.transcriptText}>{transcript}</Text>
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
    maxHeight: '75%',
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
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: '#374151',
    lineHeight: 24,
    paddingBottom: 32,
  },
});
