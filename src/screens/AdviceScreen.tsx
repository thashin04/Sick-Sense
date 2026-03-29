import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

interface ActionableTip {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tip: string;
}

const ACTIONABLE_TIPS: ActionableTip[] = [
  { icon: 'walk-outline', tip: 'Avoid outdoor activities between 6–10 AM when pollen counts are highest.' },
  { icon: 'hand-left-outline', tip: 'Wash hands frequently — flu activity is elevated at nearby schools and clinics.' },
  { icon: 'medkit-outline', tip: 'Stock up on antihistamines; oak pollen levels are high across Central Florida.' },
  { icon: 'people-outline', tip: 'Limit crowded indoor spaces for the next 48–72 hours if immunocompromised.' },
  { icon: 'water-outline', tip: 'Stay hydrated and get adequate rest to support immune function.' },
];

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
import { useTranslation } from 'react-i18next';

export default function AdviceScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const HEADER_H = 190;
  const [inNetworkOpen, setInNetworkOpen] = React.useState(false);
  const [tips, setTips] = React.useState<ActionableTip[]>(ACTIONABLE_TIPS);
  const [risks, setRisks] = React.useState<RiskAnalysisItem[]>(RISK_ITEMS);
  const [forecast, setForecast] = React.useState('Moderate');

  React.useEffect(() => {
    async function fetchAdvice() {
      try {
        const res = await fetch('http://localhost:8000/api/city/Tampa/summary');
        if (res.ok) {
          const data = await res.json();
          
          if (data.forecast) {
            // Extract the risk word (e.g. 'Moderate') from the forecast sentence if possible
            const match = data.forecast.match(/risk level is (\w+)/i);
            if (match) setForecast(match[1]);
          }

          if (data.health_tips && Array.isArray(data.health_tips)) {
            setTips(data.health_tips.map((t: any) => ({
              icon: `${t.icon}-outline` as any, // Append -outline to match frontend design
              tip: t.text
            })));
          }

          if (data.local_risk_levels) {
            const newRisks: RiskAnalysisItem[] = [];
            
            const flu = data.local_risk_levels.seasonal_flu;
            const cold = data.local_risk_levels.common_cold;
            
            if (flu && typeof flu === 'object') {
              newRisks.push({
                name: 'Seasonal Flu',
                subtext: 'Localized Assessment',
                percent: (flu.level === 'High' ? 80 : flu.level === 'Moderate' ? 50 : 20),
                description: flu.description
              });
            }
            if (cold && typeof cold === 'object') {
              newRisks.push({
                name: 'Common Cold',
                subtext: 'Localized Assessment',
                percent: (cold.level === 'High' ? 80 : cold.level === 'Moderate' ? 50 : 20),
                description: cold.description
              });
            }

            if (data.local_risk_levels.others && Array.isArray(data.local_risk_levels.others)) {
              data.local_risk_levels.others.forEach((other: any) => {
                newRisks.push({
                  name: other.name,
                  subtext: 'Detected Signal',
                  percent: (other.level === 'High' ? 80 : other.level === 'Moderate' ? 50 : 20),
                  description: other.description
                });
              });
            }
            
            if (newRisks.length > 0) setRisks(newRisks);
          }
        }
      } catch (e) {
        console.error('[Advice] Fetch failed:', e);
      }
    }
    fetchAdvice();
  }, []);

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
              <View style={styles.headerTopRow}>
                <TouchableOpacity style={styles.locationPill} activeOpacity={0.7}>
                  <Text style={styles.locationTxt}>{t('common.current_location')}</Text>
                  <Ionicons name="chevron-down" size={14} color={Colors.indigo} />
                </TouchableOpacity>
                <TouchableOpacity hitSlop={12}>
                  <Ionicons name="information-circle-outline" size={26} color={Colors.indigo} />
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1 }} />
              <Text style={styles.pageTitle}>{t('advice.page_title')}</Text>
              <Text style={styles.pageSubtitle}>
                "The local risk level is{' '}
                <Text style={styles.riskWord}>{forecast}</Text>
                {' '}today, Shin."
              </Text>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.scrollInner}>
        {/* Actionable Tips */}
        <View style={[styles.card, { marginTop: 32 }]}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="bulb-outline" size={18} color={Colors.indigo} />
            <Text style={styles.cardTitle}>  {t('advice.tips_title')}</Text>
          </View>
          {tips.map((item, i) => (
            <View
              key={i}
              style={[styles.tipRow, i < tips.length - 1 && styles.tipRowBorder]}
            >
              <View style={styles.tipIconWrap}>
                <Ionicons name={item.icon} size={18} color={Colors.indigo} />
              </View>
              <Text style={styles.tipText}>{item.tip}</Text>
            </View>
          ))}
        </View>

        {/* Risk Analysis */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.indigo} />
            <Text style={styles.cardTitle}>  {t('advice.risk_analysis_title')}</Text>
          </View>

          {risks.map((item, i) => (
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
            <Text style={styles.cardTitle}>  {t('advice.in_network_title')}</Text>
          </View>
          <Text style={styles.inNetworkSub}>
            {t('advice.in_network_sub')}
          </Text>
          <TouchableOpacity style={styles.inNetworkBtn} activeOpacity={0.85} onPress={() => setInNetworkOpen(true)}>
            <Text style={styles.inNetworkBtnTxt}>{t('advice.in_network_btn')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 16 }} />
        </View>
      </ScrollView>

      {/* ── Tab Bar ── */}
      <SafeAreaView edges={['bottom']} style={styles.tabBarSafe}>
        <View style={styles.tabBar}>
          {[
            { icon: 'home-outline' as const, key: 'Home', label: t('tabs.home'), active: false },
            { icon: 'map-outline' as const, key: 'Map', label: t('tabs.map'), active: false },
            { icon: 'trending-up' as const, key: 'Advice', label: t('tabs.advice'), active: true },
            { icon: 'settings-outline' as const, key: 'Settings', label: t('tabs.settings'), active: false },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => {
                if (!tab.active) {
                  if (tab.key === 'Home') navigation.navigate('Dashboard');
                  if (tab.key === 'Map') navigation.navigate('Map');
                  if (tab.key === 'Settings') navigation.navigate('Settings');
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
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, overflow: 'visible' },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationTxt: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.indigo },
  pageTitle: { fontFamily: FontFamily.extraBold, fontSize: 32, color: Colors.indigo, marginBottom: 6 },
  pageSubtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.indigo },
  riskWord: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.indigo },

  // Header container — sized by the image (normal flow), content overlaid absolutely
  headerContainer: {},

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {},
  scrollInner: { paddingHorizontal: 16, paddingTop: 16 },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    shadowColor: Colors.indigo,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.indigo },

  // Tips
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
  },
  tipRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightMidBlue,
  },
  tipIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.cloudBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#374151',
    lineHeight: 20,
  },

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
