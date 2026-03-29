import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'react-native';
import SelfReportModal from '../components/modals/SelfReportModal';
import TranscriptModal from '../components/modals/TranscriptModal';
import HelpModal from '../components/modals/HelpModal';
import { Colors, FontFamily, FontSize } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RiskLevel {
  name: string;
  level: 'Low' | 'Medium' | 'High';
  /** Ionicons icon name */
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

export interface OtcItem {
  name: string;
  status: 'In Stock' | 'High Stock' | 'Limited' | 'Out of Stock';
}

// ─── Mock data (replace with real API data) ───────────────────────────────────

const RISK_LEVELS: RiskLevel[] = [
  { name: 'Seasonal Flu', level: 'Low', icon: 'nuclear-outline' },
  { name: 'Common Cold', level: 'High', icon: 'thermometer-outline' },
];

const OTC_ITEMS: OtcItem[] = [
  { name: 'Ibuprofen', status: 'In Stock' },
  { name: "Children's Acetaminophen", status: 'Limited' },
  { name: 'Rapid Antigen Tests', status: 'High Stock' },
];

const OTC_STORE = 'CVS';
const OTC_DISTANCE = '0.4 MI';

const QUICK_TIP =
  'Flu season peaks in Florida from December to February. Consider getting vaccinated and practice frequent handwashing to reduce risk.';

const AUDIO_DURATION = '2:34';

// Placeholder transcript — will be populated by backend TTS response
const TRANSCRIPT =
  'Good morning, Thashin. Here is your daily health report for your area.\n\nSeasonal flu activity remains low this week, though Common Cold cases are trending high. Two nearby pharmacies reported reduced stock of children\'s fever reducers yesterday.\n\nOur recommendation: If you or a family member are immunocompromised, consider limiting crowded indoor spaces for the next 48–72 hours. Rapid antigen tests are available at the CVS 0.4 miles from you.\n\nStay hydrated, wash hands frequently, and have a safe day.';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BG_IMAGES = {
  day: require('../assets/light-day.png'),
  afternoon: require('../assets/light-afternoon.png'),
  evening: require('../assets/light-evening.png'),
};

function getHeaderImage() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return BG_IMAGES.day;
  if (h >= 12 && h < 17) return BG_IMAGES.afternoon;
  return BG_IMAGES.evening;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function riskColor(level: RiskLevel['level']) {
  return level === 'High' ? Colors.coral : level === 'Medium' ? Colors.sunlight : Colors.babyBlue;
}

function riskBarWidth(level: RiskLevel['level']): `${number}%` {
  return level === 'High' ? '80%' : level === 'Medium' ? '50%' : '22%';
}

function otcStatusColor(status: OtcItem['status']) {
  if (status === 'In Stock' || status === 'High Stock') return Colors.babyBlue;
  if (status === 'Limited') return Colors.coral;
  return '#EF4444';
}


// ─── Sub-components ───────────────────────────────────────────────────────────

function Waveform() {
  const bars = [3, 6, 10, 7, 14, 9, 12, 5, 8, 14, 6, 10, 8, 13, 5, 9, 7, 12, 6, 4];
  return (
    <View style={waveStyles.row}>
      {bars.map((h, i) => (
        <View key={i} style={[waveStyles.bar, { height: h }]} />
      ))}
    </View>
  );
}

const waveStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
  bar: { width: 3, borderRadius: 2, backgroundColor: Colors.lightMidBlue },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const HEADER_H = 250;

  const [selfReportOpen, setSelfReportOpen] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <View style={styles.root}>
      {/* ── Scrollable content (header scrolls with page) ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.headerContainer}>
          <Image
            source={getHeaderImage()}
            style={{ width: '100%', height: HEADER_H + 110 }}
            resizeMode="cover"
          />
          <SafeAreaView edges={['top']} style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}>
            <View style={[styles.header, { height: HEADER_H }]}>
              {/* Top row */}
              <View style={styles.headerTopRow}>
                <TouchableOpacity style={styles.locationPill} activeOpacity={0.7}>
                  <Text style={styles.locationTxt}>Current Location</Text>
                  <Ionicons name="chevron-down" size={14} color={Colors.indigo} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setHelpOpen(true)} hitSlop={12}>
                  <Ionicons name="information-circle-outline" size={26} color={Colors.indigo} />
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1 }} />
              {/* Greeting */}
              <Text style={styles.dateText}>{formatDate(new Date())}</Text>
              <Text style={styles.greeting} numberOfLines={2}>
                {getGreeting()},{'\n'}Thashin
              </Text>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.scrollInner}>
        {/* Daily Health Report */}
        <View style={[styles.card, { marginTop: 20 }]}>
          <Text style={styles.cardTitle}>Daily Health Report</Text>
          <TouchableOpacity
            style={styles.playerRow}
            activeOpacity={0.7}
            onPress={() => {
              // TODO: trigger audio playback via backend TTS
            }}
          >
            <View style={styles.playBtn}>
              <Ionicons name="play" size={18} color={Colors.white} />
            </View>
            <View style={styles.waveWrap}>
              <Text style={styles.duration}>{AUDIO_DURATION}</Text>
              <Waveform />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.transcriptLink}
            onPress={() => setTranscriptOpen(true)}
          >
            <Text style={styles.transcriptLinkTxt}>Show Transcript</Text>
          </TouchableOpacity>
        </View>

        {/* Self Report */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Self Report</Text>
          <Text style={styles.selfReportSub}>
            Report symptoms, sick contacts, or supply shortages
          </Text>
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => setSelfReportOpen(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.reportBtnTxt}>Report Health Issue</Text>
          </TouchableOpacity>
        </View>

        {/* Local Risk Levels */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Local Risk Levels</Text>
          <TouchableOpacity hitSlop={8} onPress={() => navigation.navigate('Map')}>
            <Text style={styles.sectionLink}>VIEW MAP</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.riskRow}>
          {RISK_LEVELS.map((risk) => (
            <View key={risk.name} style={styles.riskCard}>
              <Ionicons name={risk.icon} size={22} color={Colors.indigo} />
              <Text style={styles.riskName}>{risk.name}</Text>
              <Text style={[styles.riskLevel, { color: riskColor(risk.level) }]}>
                {risk.level}
              </Text>
              <View style={styles.riskBarTrack}>
                <View
                  style={[
                    styles.riskBarFill,
                    { width: riskBarWidth(risk.level), backgroundColor: riskColor(risk.level) },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Local OTC Stock */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Local OTC Stock</Text>
          <Text style={styles.sectionMeta}>
            {OTC_STORE}  ·  {OTC_DISTANCE}
          </Text>
        </View>
        <View style={[styles.card, { marginBottom: 32 }]}>
          {OTC_ITEMS.map((item, i) => (
            <View
              key={item.name}
              style={[styles.otcRow, i < OTC_ITEMS.length - 1 && styles.otcRowBorder]}
            >
              <View style={[styles.otcDot, { backgroundColor: otcStatusColor(item.status) }]} />
              <Text style={styles.otcName}>{item.name}</Text>
              <Text style={[styles.otcStatus, { color: otcStatusColor(item.status) }]}>
                {item.status}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick Tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Ionicons name="warning-outline" size={16} color={Colors.sunlight} />
            <Text style={styles.tipLabel}>  QUICK TIP</Text>
          </View>
          <Text style={styles.tipBody}>{QUICK_TIP}</Text>
        </View>

        <View style={{ height: 16 }} />
        </View>
      </ScrollView>

      {/* ── Bottom Tab Bar ── */}
      <SafeAreaView edges={['bottom']} style={styles.tabBarSafe}>
        <View style={styles.tabBar}>
          {[
            { icon: 'home' as const, label: 'Home', active: true },
            { icon: 'map-outline' as const, label: 'Map', active: false },
            { icon: 'trending-up-outline' as const, label: 'Advice', active: false },
            { icon: 'settings-outline' as const, label: 'Settings', active: false },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.label}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => {
                if (!tab.active) {
                  if (tab.label === 'Map') navigation.navigate('Map');
                  if (tab.label === 'Advice') navigation.navigate('Advice');
                  if (tab.label === 'Settings') navigation.navigate('Settings');
                }
              }}
            >
              <View style={tab.active ? styles.tabIconActive : styles.tabIconInactive}>
                <Ionicons
                  name={tab.active ? tab.icon : tab.icon}
                  size={22}
                  color={tab.active ? Colors.white : '#9CA3AF'}
                />
              </View>
              <Text style={[styles.tabLabel, tab.active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {/* ── Modals ── */}
      <SelfReportModal visible={selfReportOpen} onClose={() => setSelfReportOpen(false)} />
      <TranscriptModal
        visible={transcriptOpen}
        onClose={() => setTranscriptOpen(false)}
        transcript={TRANSCRIPT}
        duration={AUDIO_DURATION}
      />
      <HelpModal visible={helpOpen} onClose={() => setHelpOpen(false)} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cloudBlue,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    overflow: 'visible',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.indigo,
  },
  dateText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.indigo,
    marginBottom: 4,
  },
  greeting: {
    fontFamily: FontFamily.extraBold,
    fontSize: 40,
    color: Colors.indigo,
    lineHeight: 50,
  },

  // Header container — sized by the image (normal flow), content overlaid absolutely
  headerContainer: {},

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {},
  scrollInner: { paddingHorizontal: 16, paddingTop: 16 },

  // Card
  card: {
    marginTop: 4 ,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: Colors.indigo,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.indigo,
    marginBottom: 12,
  },

  // Audio player
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveWrap: {
    flex: 1,
  },
  duration: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: '#9CA3AF',
    textAlign: 'right',
    marginBottom: 4,
  },
  transcriptLink: { alignSelf: 'flex-end' },
  transcriptLinkTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.black,
    textDecorationLine: 'underline',
  },

  // Self report
  selfReportHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  selfReportSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#6B7280',
    marginBottom: 14,
  },
  reportBtn: {
    backgroundColor: Colors.indigo,
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: 'center',
  },
  reportBtnTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.white,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.indigo,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionLink: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.babyBlue,
    letterSpacing: 0.5,
  },
  sectionMeta: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#6B7280',
  },

  // Risk cards
  riskRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  riskCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.indigo,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  riskName: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  riskLevel: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize.xxl,
    marginBottom: 10,
  },
  riskBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.lightMidBlue,
  },
  riskBarFill: {
    height: 5,
    borderRadius: 3,
  },

  // OTC
  otcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  otcRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightMidBlue,
  },
  otcDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 12,
  },
  otcName: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: '#111827',
  },
  otcStatus: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
  },

  // Quick tip
  tipCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 3,
    borderLeftColor: Colors.sunlight,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: '#C8860A',
    letterSpacing: 0.8,
  },
  tipBody: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#92400E',
    lineHeight: 20,
  },

  // Tab bar
  tabBarSafe: { backgroundColor: Colors.white },
  tabBar: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.lightMidBlue,
    backgroundColor: Colors.white,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabIconActive: {
    width: 48,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconInactive: {
    width: 48,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#9CA3AF',
  },
  tabLabelActive: {
    fontFamily: FontFamily.semiBold,
    color: Colors.indigo,
  },
});
