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
import Svg, { Path, Line, Circle, Text as SvgText, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'react-native';
import { Colors, FontFamily, FontSize } from '../theme';
import { RootStackParamList } from '../types/navigation';
import InNetworkModal from '../components/modals/InNetworkModal';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Advice'>;
};

// ─── Mock data (replace with backend API responses) ───────────────────────────

const TREND_DATA = [45, 52, 60, 70, 80, 75, 72]; // 7 points, Mar 12–24 (every 2 days)
const TREND_X_LABEL_INDICES = [0, 2, 4, 6];
const TREND_X_LABELS = ['Mar 12', 'Mar 16', 'Mar 20', 'Mar 24'];
const TREND_Y_LABELS = [100, 75, 50, 25, 0];
const TREND_NOTE = 'Cases trending down this week. Peak was on March 20th.';

interface RiskAnalysisItem {
  name: string;
  subtext: string;
  percent: number;
  description: string;
}

const RISK_ITEMS: RiskAnalysisItem[] = [
  {
    name: 'Seasonal Allergies',
    subtext: 'High pollen count in Florida',
    percent: 80,
    description:
      'Your symptoms align with seasonal allergy patterns. Current oak pollen levels are elevated across Central Florida.',
  },
  {
    name: 'Viral Infection',
    subtext: 'Based on current symptoms',
    percent: 20,
    description:
      'Lower probability. Monitor for fever or body aches which would indicate viral cause.',
  },
];

const RECOMMENDATION =
  'Consider antihistamines and avoid outdoor activities during peak pollen hours (6–10 AM).';

// ─── Chart helpers ────────────────────────────────────────────────────────────

function smoothPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length < 2) return '';
  const t = 0.3;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) * t;
    const cp1y = p1.y + (p2.y - p0.y) * t;
    const cp2x = p2.x - (p3.x - p1.x) * t;
    const cp2y = p2.y - (p3.y - p1.y) * t;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

// ─── Line Chart ───────────────────────────────────────────────────────────────

function LineChart({ containerWidth }: { containerWidth: number }) {
  const PAD_LEFT = 38;
  const PAD_RIGHT = 8;
  const PAD_TOP = 8;
  const PAD_BOTTOM = 26;
  const SVG_H = 190;
  const chartW = containerWidth - PAD_LEFT - PAD_RIGHT;
  const chartH = SVG_H - PAD_TOP - PAD_BOTTOM;
  const yMax = 100;
  const n = TREND_DATA.length;

  const xOf = (i: number) => PAD_LEFT + (i / (n - 1)) * chartW;
  const yOf = (v: number) => PAD_TOP + (1 - v / yMax) * chartH;

  const points = TREND_DATA.map((v, i) => ({ x: xOf(i), y: yOf(v) }));
  const linePath = smoothPath(points);

  return (
    <Svg width={containerWidth} height={SVG_H}>
      <Defs>
        <SvgGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={Colors.indigo} stopOpacity="0.15" />
          <Stop offset="1" stopColor={Colors.indigo} stopOpacity="0" />
        </SvgGradient>
      </Defs>

      {/* Y-axis grid lines + labels */}
      {TREND_Y_LABELS.map((v) => {
        const y = yOf(v);
        return (
          <React.Fragment key={v}>
            <Line
              x1={PAD_LEFT}
              y1={y}
              x2={containerWidth - PAD_RIGHT}
              y2={y}
              stroke="#E5E7EB"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <SvgText
              x={PAD_LEFT - 6}
              y={y + 4}
              fontSize={9}
              fill="#9CA3AF"
              textAnchor="end"
              fontFamily={FontFamily.regular}
            >
              {v}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* X-axis labels */}
      {TREND_X_LABEL_INDICES.map((dataIdx, i) => (
        <SvgText
          key={i}
          x={xOf(dataIdx)}
          y={SVG_H - 4}
          fontSize={9}
          fill="#9CA3AF"
          textAnchor="middle"
          fontFamily={FontFamily.regular}
        >
          {TREND_X_LABELS[i]}
        </SvgText>
      ))}

      {/* Area fill */}
      <Path
        d={`${linePath} L ${points[n - 1].x} ${yOf(0)} L ${points[0].x} ${yOf(0)} Z`}
        fill="url(#lineGrad)"
      />

      {/* Line */}
      <Path
        d={linePath}
        stroke={Colors.indigo}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data point dots */}
      {points.map((p, i) => (
        <React.Fragment key={i}>
          <Circle cx={p.x} cy={p.y} r={3.5} fill={Colors.white} />
          <Circle cx={p.x} cy={p.y} r={2} fill={Colors.indigo} />
        </React.Fragment>
      ))}
    </Svg>
  );
}

// ─── Dynamic Header Helper ───────────────────────────────────────────────────

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

// ─── Screen ───────────────────────────────────────────────────────────────────

import React from 'react';

export default function AdviceScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const HEADER_H = 190;
  const [inNetworkOpen, setInNetworkOpen] = React.useState(false);

  // Chart container width: screen - horizontal scroll padding (16*2) - card padding (18*2)
  const chartWidth = width - 32 - 36;

  return (
    <View style={styles.root}>
      <Image
        source={getHeaderImage()}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: HEADER_H + 110 }}
        resizeMode="cover"
      />
      {/* ── Header ── */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
        <View style={[styles.header, { height: HEADER_H }]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.locationPill} activeOpacity={0.7}>
              <Text style={styles.locationTxt}>Current Location</Text>
              <Ionicons name="chevron-down" size={14} color={Colors.indigo} />
            </TouchableOpacity>
            <TouchableOpacity hitSlop={12}>
              <Ionicons name="information-circle-outline" size={26} color={Colors.indigo} />
            </TouchableOpacity>
          </View>

          <Text style={styles.pageTitle}>Health Forecast</Text>
          <Text style={styles.pageSubtitle}>
            "The local risk level is{' '}
            <Text style={styles.riskWord}>Moderate</Text>
            {' '}today, Shin."
          </Text>
        </View>
      </SafeAreaView>

      {/* ── Content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Local Illness Trends */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="trending-up-outline" size={18} color={Colors.indigo} />
            <Text style={styles.cardTitle}>  Local Illness Trends</Text>
          </View>
          <Text style={styles.chartLabel}>Influenza Cases (14-day trend)</Text>
          <LineChart containerWidth={chartWidth} />
          <View style={styles.trendNote}>
            <Text style={styles.trendNoteTxt}>{TREND_NOTE}</Text>
          </View>
        </View>

        {/* Risk Analysis */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.indigo} />
            <Text style={styles.cardTitle}>  Risk Analysis</Text>
          </View>

          {RISK_ITEMS.map((item, i) => (
            <View key={i} style={styles.riskCard}>
              <View style={styles.riskCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.riskName}>{item.name}</Text>
                  <Text style={styles.riskSubtext}>{item.subtext}</Text>
                </View>
                <Text style={styles.riskPercent}>{item.percent}%</Text>
              </View>
              <Text style={styles.riskDesc}>{item.description}</Text>
            </View>
          ))}

          <View style={styles.recommendBox}>
            <Text style={styles.recommendTxt}>
              <Text style={styles.recommendBold}>Recommendation: </Text>
              {RECOMMENDATION}
            </Text>
          </View>
        </View>

        {/* In-Network Care */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="clipboard-outline" size={18} color={Colors.indigo} />
            <Text style={styles.cardTitle}>  In-Network Care</Text>
          </View>
          <Text style={styles.inNetworkSub}>
            Find healthcare providers and facilities that accept your insurance plan in your area.
          </Text>
          <TouchableOpacity style={styles.inNetworkBtn} activeOpacity={0.85} onPress={() => setInNetworkOpen(true)}>
            <Text style={styles.inNetworkBtnTxt}>Find In-Network Providers</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── Tab Bar ── */}
      <SafeAreaView edges={['bottom']} style={styles.tabBarSafe}>
        <View style={styles.tabBar}>
          {[
            { icon: 'home-outline' as const, label: 'Home', active: false },
            { icon: 'map-outline' as const, label: 'Map', active: false },
            { icon: 'trending-up' as const, label: 'Advice', active: true },
            { icon: 'settings-outline' as const, label: 'Settings', active: false },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.label}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => {
                if (!tab.active) {
                  if (tab.label === 'Home') navigation.navigate('Dashboard');
                  if (tab.label === 'Map') navigation.navigate('Map');
                  if (tab.label === 'Settings') navigation.navigate('Settings');
                }
              }}
            >
              <View style={tab.active ? styles.tabIconActive : styles.tabIconInactive}>
                <Ionicons name={tab.icon} size={22} color={tab.active ? Colors.white : '#9CA3AF'} />
              </View>
              <Text style={[styles.tabLabel, tab.active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      <InNetworkModal
        visible={inNetworkOpen}
        onClose={() => setInNetworkOpen(false)}
        insurancePlan="Florida Blue"
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cloudBlue },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 12, overflow: 'visible' },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationTxt: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.indigo },
  pageTitle: { fontFamily: FontFamily.extraBold, fontSize: 32, color: Colors.indigo, marginBottom: 6 },
  pageSubtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.indigo },
  riskWord: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.indigo },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  // Card
  card: {
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
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.indigo },

  // Chart
  chartLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: '#9CA3AF', marginBottom: 6 },
  trendNote: {
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.sunlight,
  },
  trendNoteTxt: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: '#92400E', lineHeight: 18 },

  // Risk cards
  riskCard: {
    backgroundColor: Colors.cloudBlue,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  riskCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  riskName: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.black },
  riskSubtext: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: '#6B7280', marginTop: 2 },
  riskPercent: { fontFamily: FontFamily.extraBold, fontSize: 26, color: Colors.indigo, marginLeft: 8 },
  riskDesc: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: '#374151', lineHeight: 19 },

  // Recommendation
  recommendBox: {
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
    marginTop: 4,
  },
  recommendTxt: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: '#166534', lineHeight: 19 },
  recommendBold: { fontFamily: FontFamily.bold },

  // In-Network Care
  inNetworkSub: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: '#6B7280', marginBottom: 16, lineHeight: 20 },
  inNetworkBtn: {
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
  inNetworkBtnTxt: { fontFamily: FontFamily.semiBold, fontSize: FontSize.lg, color: Colors.white },

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
  tabItem: { flex: 1, alignItems: 'center', gap: 4 },
  tabIconActive: {
    width: 48, height: 32, borderRadius: 16,
    backgroundColor: Colors.indigo, alignItems: 'center', justifyContent: 'center',
  },
  tabIconInactive: { width: 48, height: 32, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontFamily: FontFamily.regular, fontSize: 11, color: '#9CA3AF' },
  tabLabelActive: { fontFamily: FontFamily.semiBold, color: Colors.indigo },
});
