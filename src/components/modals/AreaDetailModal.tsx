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
      <View style={styles.modalContainer}>
        {/* Backdrop - press to close */}
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose} 
        />
        
        {/* Sheet - non-touch-absorbing container */}
        <View style={[styles.sheet, { backgroundColor: theme.surfaceModal, shadowColor: theme.shadowColor }]}>
          {/* Close */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={theme.muted} />
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
            <View style={[styles.statCard, { backgroundColor: theme.surfaceSecondary }]}>
              <Text style={[styles.statLabel, { color: theme.sectionLabel }]}>{t('area_detail_modal.risk_index')}</Text>
              <Text style={[styles.statValue, { color: riskColor(area.riskLevel) }]}>
                {area.riskLevel} {t('area_detail_modal.risk_suffix')}
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surfaceTertiary }]}>
              <Text style={[styles.statLabel, { color: theme.sectionLabel }]}>{t('area_detail_modal.trans_rate')}</Text>
              <Text style={[styles.statValue, { color: theme.heading }]}>
                {area.transmissionRate.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Active alerts */}
          <View style={styles.alertsHeader}>
            <Text style={[styles.alertsTitle, { color: theme.sectionLabel }]}>{t('area_detail_modal.active_alerts')}</Text>
            <View style={[styles.alertDot, { backgroundColor: theme.error }]} />
          </View>

          <View style={styles.listWrap}>
            <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
              {area.alerts.map((alert, i) => (
                <View key={i} style={[styles.alertCard, { borderColor: theme.border, backgroundColor: theme.surfaceSecondary }]}>
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
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: theme.primary }]}
            activeOpacity={0.85}
            onPress={onClose}
          >
            <Text style={[styles.ctaTxt, { color: theme.primaryText }]}>{t('area_detail_modal.view_advice')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderRadius: 24,
    padding: 24,
    maxHeight: '85%',
    elevation: 5,
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
    fontFamily: FontFamily.bold,
    fontSize: 26,
    marginBottom: 2,
  },
  areaCity: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
  },
  scoreBadge: {
    width: 60,
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  scoreTxt: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: Colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  statLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingRight: 4,
  },
  alertsTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listWrap: {
    maxHeight: 200,
    marginBottom: 20,
  },
  alertsList: {
    width: '100%',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  alertIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertName: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    marginBottom: 2,
  },
  alertDesc: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  ctaBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaTxt: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
  },
});
