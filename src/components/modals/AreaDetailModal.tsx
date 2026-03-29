import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, FontFamily, FontSize } from '../../theme';
import { useAppTheme } from '../../hooks/useAppTheme';

export interface AreaAlert {
  name: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface AreaDetail {
  name: string;
  city: string;
  state: string;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  transmissionRate: number;
  alerts: AreaAlert[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  area: AreaDetail;
}

function riskColor(level: AreaDetail['riskLevel']) {
  if (level === 'High') return Colors.coral;
  if (level === 'Medium') return Colors.sunlight;
  return '#22C55E';
}

function scoreColor(score: number) {
  if (score >= 7) return Colors.coral;
  if (score >= 4) return Colors.sunlight;
  return '#22C55E';
}

function alertIconColor(severity: AreaAlert['severity']) {
  if (severity === 'high') return Colors.coral;
  if (severity === 'medium') return Colors.sunlight;
  return '#22C55E';
}

function alertIconBg(severity: AreaAlert['severity']) {
  if (severity === 'high') return '#FDECEA';
  if (severity === 'medium') return '#FFF8E1';
  return '#E8F5E9';
}

export default function AreaDetailModal({ visible, onClose, area }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: theme.surfaceModal, shadowColor: theme.shadowColor }]}>
          {/* Close */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={20} color={theme.muted} />
          </TouchableOpacity>

          {/* Title row */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.areaName, { color: theme.heading }]}>{area.name}</Text>
              <Text style={[styles.areaCity, { color: theme.muted }]}>
                {area.city}, {area.state}
              </Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: scoreColor(area.riskScore) }]}>
              <Text style={styles.scoreTxt}>{area.riskScore.toFixed(1)}</Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : '#FEF2F2' }]}>
              <Text style={[styles.statLabel, { color: theme.sectionLabel }]}>{t('area_detail_modal.risk_index')}</Text>
              <Text style={[styles.statValue, { color: riskColor(area.riskLevel) }]}>
                {area.riskLevel} {t('area_detail_modal.risk_suffix')}
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : Colors.cloudBlue }]}>
              <Text style={[styles.statLabel, { color: theme.sectionLabel }]}>{t('area_detail_modal.trans_rate')}</Text>
              <Text style={[styles.statValue, { color: theme.isDark ? '#A3C7FF' : Colors.indigo }]}>
                {area.transmissionRate.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Active alerts */}
          <View style={styles.alertsHeader}>
            <Text style={[styles.alertsTitle, { color: theme.sectionLabel }]}>{t('area_detail_modal.active_alerts')}</Text>
            <View style={styles.alertDot} />
          </View>

          <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
            {area.alerts.map((alert, i) => (
              <View key={i} style={[styles.alertCard, { borderColor: theme.border }]}>
                <View style={[styles.alertIconWrap, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : alertIconBg(alert.severity) }]}>
                  <Ionicons name="alert-circle-outline" size={20} color={alertIconColor(alert.severity)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.alertName, { color: theme.body }]}>{alert.name}</Text>
                  <Text style={[styles.alertDesc, { color: theme.muted }]}>{alert.description}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* CTA */}
          <TouchableOpacity
            style={styles.ctaBtn}
            activeOpacity={0.85}
            onPress={() => {
              onClose();
              // TODO: navigate to Advice screen
            }}
          >
            <Text style={styles.ctaTxt}>{t('area_detail_modal.view_advice')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  closeBtn: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  areaName: {
    fontFamily: FontFamily.extraBold,
    fontSize: 26,
    color: Colors.indigo,
    marginBottom: 2,
  },
  areaCity: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: '#6B7280',
  },
  scoreBadge: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  scoreTxt: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize.xl,
    color: Colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
  },
  statLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  statValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  alertsTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: '#9CA3AF',
    letterSpacing: 0.8,
  },
  alertDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.coral,
  },
  alertsList: {
    maxHeight: 160,
    marginBottom: 18,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.lightMidBlue,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertName: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.black,
    marginBottom: 2,
  },
  alertDesc: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: '#6B7280',
  },
  ctaBtn: {
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
  ctaTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
});
