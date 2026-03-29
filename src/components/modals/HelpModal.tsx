import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize } from '../../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    icon: 'home-outline' as const,
    title: 'Dashboard',
    body: 'Your home screen shows a personalized health overview for your current location — including a daily audio report, local disease risk levels, and nearby OTC medication stock.',
  },
  {
    icon: 'volume-high-outline' as const,
    title: 'Daily Health Report',
    body: 'Each morning, SickSense generates a short audio briefing summarizing outbreak activity, risk levels, and health tips in your area. Tap the play button to listen, or "Show Transcript" to read it.',
  },
  {
    icon: 'map-outline' as const,
    title: 'Local Risk Levels',
    body: 'See real-time risk ratings for illnesses like Seasonal Flu, Common Cold, and more. Ratings are updated using pharmacy stock data, ER wait times, and other local signals — not just official reports.',
  },
  {
    icon: 'bag-outline' as const,
    title: 'Local OTC Stock',
    body: 'Check whether key medications (Ibuprofen, Antigen Tests, etc.) are available at pharmacies near you. Supply shortages often predict outbreaks before clinical data does.',
  },
  {
    icon: 'warning-outline' as const,
    title: 'Self Reporting',
    body: 'If you or someone near you is sick or you notice empty shelves, you can submit an anonymous report. Your data helps SickSense detect outbreaks earlier for everyone.',
  },
  {
    icon: 'trending-up-outline' as const,
    title: 'Map View',
    body: 'Switch to the Map tab to see a geographic view of outbreak activity across Florida. High-risk areas are highlighted to help you plan ahead.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Your Privacy',
    body: 'SickSense never shares your personal health data. All self-reports are anonymized. Location data is only used to show you local information — it is never stored or sold.',
  },
];

export default function HelpModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>How SickSense Works</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSub}>
            Everything you need to know about your health dashboard.
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
            {SECTIONS.map((s, i) => (
              <View key={i} style={styles.section}>
                <View style={styles.sectionIconWrap}>
                  <Ionicons name={s.icon} size={20} color={Colors.darkBlue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>{s.title}</Text>
                  <Text style={styles.sectionBody}>{s.body}</Text>
                </View>
              </View>
            ))}
            <View style={{ height: 32 }} />
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
