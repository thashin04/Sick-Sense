import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { useAppTheme } from '../hooks/useAppTheme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RiskLevel {
  name: string;
  level: 'Low' | 'Medium' | 'Moderate' | 'High';
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BG_IMAGES = {
  light: {
    day: require('../assets/light-day.png'),
    afternoon: require('../assets/light-afternoon.png'),
    evening: require('../assets/light-evening.png'),
  },
  dark: {
    day: (() => { try { return require('../assets/dark-day.png'); } catch { return require('../assets/light-day.png'); } })(),
    afternoon: (() => { try { return require('../assets/dark-afternoon.png'); } catch { return require('../assets/light-afternoon.png'); } })(),
    evening: (() => { try { return require('../assets/dark-night.png'); } catch { return require('../assets/light-evening.png'); } })(),
  },
};

function getHeaderImage(isDark: boolean) {
  const set = isDark ? BG_IMAGES.dark : BG_IMAGES.light;
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return set.day;
  if (h >= 12 && h < 17) return set.afternoon;
  return set.evening;
}

function getGreetingKey(): 'greeting.morning' | 'greeting.afternoon' | 'greeting.evening' {
  const h = new Date().getHours();
  if (h < 12) return 'greeting.morning';
  if (h < 18) return 'greeting.afternoon';
  return 'greeting.evening';
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
  return level === 'High' ? Colors.coral : (level === 'Medium' || level === 'Moderate') ? Colors.sunlight : Colors.babyBlue;
}

function riskBarWidth(level: RiskLevel['level']): `${number}%` {
  return level === 'High' ? '80%' : (level === 'Medium' || level === 'Moderate') ? '50%' : '22%';
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
  const { t } = useTranslation();
  const theme = useAppTheme();
  const HEADER_H = 250;

  const [selfReportOpen, setSelfReportOpen] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const [riskLevels, setRiskLevels] = useState<RiskLevel[]>(RISK_LEVELS);
  const [otcItems, setOtcItems] = useState<OtcItem[]>(OTC_ITEMS);

  const [transcript, setTranscript] = useState('Fetching daily report...');
  const [audioDuration, setAudioDuration] = useState('0:00');
  const [isPlaying, setIsPlaying] = useState(false);
  const [quickTip, setQuickTip] = useState(QUICK_TIP);
  
  // Modern Expo Audio Player (Canary 55)
  const player = useAudioPlayer('http://localhost:8000/api/city/Tampa/audio-report');
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    async function loadSummary() {
      try {
        console.log('[Dashboard] Starting summary and report load...');
        let prefIds: string[] = [];
        try {
          const authStr = await AsyncStorage.getItem('@user_auth');
          if (authStr) {
            const auth = JSON.parse(authStr);
            if (auth.uid) {
              const prefRes = await fetch(`http://localhost:8000/api/user/${auth.uid}/preferences`);
              if (prefRes.ok) {
                const prefData = await prefRes.json();
                if (prefData.preferences && prefData.preferences.otc_medicine) {
                  prefIds = prefData.preferences.otc_medicine;
                }
              }
            }
          }
        } catch (e) {
          console.warn('Failed to fetch user preferences from API', e);
        }

        if (prefIds.length === 0) {
          const prefStr = await AsyncStorage.getItem('@pref_medicine');
          prefIds = prefStr ? JSON.parse(prefStr) : [];
        }

        const ID_TO_NAME: Record<string, string> = {
          'dayquil': 'DayQuil',
          'nyquil': 'NyQuil',
          'tylenol-cold-flu': 'Tylenol Cold & Flu',
          'mucinex': 'Mucinex',
          'robitussin': 'Robitussin',
          'theraflu': 'Theraflu',
          'claritin': 'Claritin',
          'acetaminophen': 'Tylenol Cold & Flu',
          'ibuprofen': 'Tylenol Cold & Flu', 
          'antihistamines': 'Claritin',
          'cough-syrup': 'Robitussin',
          'decongestant': 'DayQuil',
          'aspirin': 'DayQuil'
        };
        const preferredNames = prefIds.map(id => ID_TO_NAME[id]).filter(Boolean);

        // Fetch summary and report in parallel for better performance and reliability
        const [sumRes, repRes] = await Promise.all([
          fetch('http://localhost:8000/api/city/Tampa/summary'),
          fetch('http://localhost:8000/api/city/Tampa/daily-report')
        ]).catch(err => {
          console.error('[Dashboard] Parallel fetch failed:', err);
          return [null, null];
        });

        if (sumRes && sumRes.ok) {
          const data = await sumRes.json();
          console.log('[Dashboard] Summary data received.');
          
          if (data.forecast) {
            setQuickTip(data.forecast);
          }

          if (data.local_risk_levels) {
            const newRisks: RiskLevel[] = [];
            
            // Handle flu/cold which might be objects or strings
            const flu = data.local_risk_levels.seasonal_flu;
            const cold = data.local_risk_levels.common_cold;
            
            if (flu) {
              newRisks.push({ 
                name: 'Seasonal Flu', 
                level: (typeof flu === 'string' ? flu : flu.level) as RiskLevel['level'], 
                icon: 'nuclear-outline' 
              });
            }
            if (cold) {
              newRisks.push({ 
                name: 'Common Cold', 
                level: (typeof cold === 'string' ? cold : cold.level) as RiskLevel['level'], 
                icon: 'thermometer-outline' 
              });
            }
            
            // Handle extras
            if (data.local_risk_levels.others && Array.isArray(data.local_risk_levels.others)) {
              data.local_risk_levels.others.slice(0, 1).forEach((other: any) => {
                newRisks.push({
                  name: other.name,
                  level: other.level as RiskLevel['level'],
                  icon: 'alert-circle-outline'
                });
              });
            }

            if (newRisks.length > 0) setRiskLevels(newRisks.slice(0, 2));
          }

          if (data.otc_stock) {
            const freshOtc = data.otc_stock
              .filter((item: any) => preferredNames.length === 0 || preferredNames.includes(item.name))
              .map((item: any) => ({ name: item.name, status: item.status }));
            setOtcItems(freshOtc);
          }
        } else {
          console.warn('[Dashboard] Summary fetch failed or not ok');
        }

        if (repRes && repRes.ok) {
          const reportData = await repRes.json();
          console.log('[Dashboard] Daily report received, script length:', reportData.tts_script?.length);
          if (reportData.tts_script) {
            setTranscript(reportData.tts_script);
            const wordCount = reportData.tts_script.split(' ').length;
            const seconds = Math.ceil(wordCount / (150 / 60));
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            setAudioDuration(`${m}:${s.toString().padStart(2, '0')}`);
          }
        } else {
          console.warn('[Dashboard] Daily report fetch failed or not ok');
          setTranscript('Health report is currently being updated. Please check back in a few minutes.');
        }

      } catch (err) {
        console.error('[Dashboard] Failed to load dashboard data:', err);
      }
    }
    loadSummary();
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* ── Scrollable content (header scrolls with page) ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.headerContainer}>
          <Image
            source={getHeaderImage(theme.isDark)}
            style={{ width: '100%', height: HEADER_H + 110 }}
            resizeMode="cover"
          />
          <SafeAreaView edges={['top']} style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}>
            <View style={[styles.header, { height: HEADER_H }]}>
              {/* Top row */}
              <View style={styles.headerTopRow}>
                <TouchableOpacity style={styles.locationPill} activeOpacity={0.7}>
                  <Text style={[styles.locationTxt, { color: theme.heading }]}>{t('common.current_location')}</Text>
                  <Ionicons name="chevron-down" size={14} color={theme.heading} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setHelpOpen(true)} hitSlop={12}>
                  <Ionicons name="information-circle-outline" size={26} color={theme.heading} />
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1 }} />
              {/* Greeting */}
              <Text style={[styles.dateText, { color: theme.isDark ? '#A3C7FF' : Colors.indigo }]}>{formatDate(new Date())}</Text>
              <Text style={[styles.greeting, { color: theme.heading }]} numberOfLines={2}>
                {t(getGreetingKey())},{'\n'}Thashin
              </Text>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.scrollInner}>
        {/* Daily Health Report */}
        <View style={[styles.card, { marginTop: 20, backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.subheading }]}>{t('dashboard.daily_report_title')}</Text>
          <View style={styles.playerRow}>
            <TouchableOpacity
              style={styles.playBtn}
              activeOpacity={0.7}
            onPress={() => {
              if (status.playing) {
                player.pause();
                setIsPlaying(false);
              } else {
                player.play();
                setIsPlaying(true);
              }
            }}
          >
            <Ionicons name={(status.playing) ? "pause" : "play"} size={28} color={Colors.white} />
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.audioWaveform}>
              {[1, 0.7, 0.9, 0.5, 0.8, 0.4, 0.6, 0.9, 0.5, 0.7, 0.4].map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.audioBar,
                    { height: 16 * h, opacity: status.playing ? 1 : 0.3 }
                  ]}
                />
              ))}
            </View>
            {status.isBuffering && (
              <Text style={{ fontSize: 10, color: '#5582F3', marginTop: 4 }}>Buffering AI Voice...</Text>
            )}
          </View>
          <Text style={styles.audioDuration}>{audioDuration}</Text>
          </View>

          <TouchableOpacity
            style={styles.transcriptLink}
            onPress={() => setTranscriptOpen(true)}
          >
            <Text style={[styles.transcriptLinkTxt, { color: theme.body }]}>{t('dashboard.show_transcript')}</Text>
          </TouchableOpacity>
        </View>

        {/* Self Report */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.subheading }]}>{t('dashboard.self_report_title')}</Text>
          <Text style={[styles.selfReportSub, { color: theme.muted }]}>
            {t('dashboard.self_report_sub')}
          </Text>
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => setSelfReportOpen(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.reportBtnTxt}>{t('dashboard.report_btn')}</Text>
          </TouchableOpacity>
        </View>

        {/* Local Risk Levels */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.subheading }]}>{t('dashboard.risk_levels_title')}</Text>
          <TouchableOpacity hitSlop={8} onPress={() => navigation.navigate('Map')}>
            <Text style={styles.sectionLink}>{t('dashboard.view_map')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.riskRow}>
          {riskLevels.map((risk) => (
            <View key={risk.name} style={[styles.riskCard, { backgroundColor: theme.surface }]}>
              <Ionicons name={risk.icon} size={22} color={theme.isDark ? '#A3C7FF' : Colors.indigo} />
              <Text style={[styles.riskName, { color: theme.body }]}>{risk.name}</Text>
              <Text style={[styles.riskLevel, { color: (risk.level === 'Medium' || risk.level === 'Moderate') ? (theme.isDark ? Colors.white : Colors.black) : riskColor(risk.level) }]}>
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
          <Text style={[styles.sectionTitle, { color: theme.subheading }]}>{t('dashboard.otc_stock_title')}</Text>
          <Text style={[styles.sectionMeta, { color: theme.muted }]}>
            {OTC_STORE}  ·  {OTC_DISTANCE}
          </Text>
        </View>
        <View style={[styles.card, { marginBottom: 32, backgroundColor: theme.surface, shadowColor: theme.shadowColor }]}>
          {otcItems.map((item, i) => (
            <View
              key={item.name}
              style={[styles.otcRow, i < otcItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.divider }]}
            >
              <View style={[styles.otcDot, { backgroundColor: otcStatusColor(item.status) }]} />
              <Text style={[styles.otcName, { color: theme.body }]}>{item.name}</Text>
              <Text style={[styles.otcStatus, { color: otcStatusColor(item.status) }]}>
                {item.status}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick Tip */}
        <View style={[styles.tipCard, theme.isDark && { backgroundColor: 'rgba(255,200,0,0.12)', borderLeftColor: Colors.sunlight }]}>
          <View style={styles.tipHeader}>
            <Ionicons name="warning-outline" size={16} color={Colors.sunlight} />
            <Text style={[styles.tipLabel, theme.isDark && { color: Colors.sunlight }]}>  {t('dashboard.quick_tip_label')}</Text>
          </View>
          <Text style={[styles.tipBody, theme.isDark && { color: '#FFD580' }]}>{quickTip}</Text>
        </View>

        <View style={{ height: 16 }} />
        </View>
      </ScrollView>

      {/* ── Bottom Tab Bar ── */}
      <SafeAreaView edges={['bottom']} style={[styles.tabBarSafe, { backgroundColor: theme.tabBar }]}>
        <View style={[styles.tabBar, { backgroundColor: theme.tabBar, borderTopColor: theme.tabBarBorder }]}>
          {[
            { icon: 'home' as const, key: 'Home', label: t('tabs.home'), active: true },
            { icon: 'map-outline' as const, key: 'Map', label: t('tabs.map'), active: false },
            { icon: 'trending-up-outline' as const, key: 'Advice', label: t('tabs.advice'), active: false },
            { icon: 'settings-outline' as const, key: 'Settings', label: t('tabs.settings'), active: false },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => {
                if (!tab.active) {
                  if (tab.key === 'Map') navigation.navigate('Map');
                  if (tab.key === 'Advice') navigation.navigate('Advice');
                  if (tab.key === 'Settings') navigation.navigate('Settings');
                }
              }}
            >
              <View style={tab.active ? styles.tabIconActive : styles.tabIconInactive}>
                <Ionicons name={tab.icon} size={22} color={tab.active ? Colors.white : theme.tabIconInactive} />
              </View>
              <Text style={[styles.tabLabel, { color: theme.tabIconInactive }, tab.active && { color: theme.isDark ? '#FFFFFF' : Colors.indigo, fontFamily: FontFamily.semiBold }]}>
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
        transcript={transcript}
        duration={audioDuration}
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
    color: Colors.white,
  },
  dateText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#A3C7FF',
    marginBottom: 4,
  },
  greeting: {
    fontFamily: FontFamily.extraBold,
    fontSize: 40,
    color: Colors.white,
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
  audioWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 16,
  },
  audioBar: {
    width: 3,
    backgroundColor: Colors.indigo,
    borderRadius: 2,
  },
  audioDuration: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: '#374151',
    marginLeft: 8,
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
