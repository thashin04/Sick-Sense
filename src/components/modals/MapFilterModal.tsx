import {
  Modal,
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize } from '../../theme';
import { useAppTheme } from '../../hooks/useAppTheme';

export interface MapFilters {
  highRisk: boolean;
  mediumRisk: boolean;
  lowRisk: boolean;
  pharmacies: boolean;
  hospitals: boolean;
  testingSites: boolean;
}

interface Props {
  visible: boolean;
  filters: MapFilters;
  onApply: (filters: MapFilters) => void;
  onClose: () => void;
}

type FilterKey = keyof MapFilters;

export default function MapFilterModal({ visible, filters, onApply, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const RISK_ROWS: { key: FilterKey; label: string; color: string }[] = [
    { key: 'highRisk', label: t('map_filter_modal.high_risk'), color: Colors.coral },
    { key: 'mediumRisk', label: t('map_filter_modal.medium_risk'), color: Colors.sunlight },
    { key: 'lowRisk', label: t('map_filter_modal.low_risk'), color: '#22C55E' },
  ];

  const LOCATION_ROWS: { key: FilterKey; label: string; color: string }[] = [
    { key: 'pharmacies', label: t('map_filter_modal.pharmacies'), color: '#22C55E' },
    { key: 'hospitals', label: t('map_filter_modal.hospitals'), color: Colors.indigo },
    { key: 'testingSites', label: t('map_filter_modal.testing_sites'), color: Colors.sunlight },
  ];
  // Local draft state so changes only commit on Apply
  const [draft, setDraft] = React.useState<MapFilters>(filters);

  // Sync draft when modal opens
  React.useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible]);

  function toggle(key: FilterKey) {
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleApply() {
    onApply(draft);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: theme.surfaceModal, shadowColor: theme.shadowColor }]}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.heading }]}>{t('map_filter_modal.title')}</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={12}
              style={[styles.closeBtn, { backgroundColor: theme.surfaceSecondary }]}
            >
              <Ionicons name="close" size={18} color={theme.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Risk Levels */}
            <Text style={[styles.sectionLabel, { color: theme.sectionLabel }]}>{t('map_filter_modal.risk_levels')}</Text>
            {RISK_ROWS.map((row) => (
              <FilterRow
                key={row.key}
                label={row.label}
                dotColor={row.color}
                value={draft[row.key]}
                onToggle={() => toggle(row.key)}
              />
            ))}

            <View style={[styles.divider, { backgroundColor: theme.divider }]} />

            {/* Location Types */}
            <Text style={[styles.sectionLabel, { color: theme.sectionLabel }]}>{t('map_filter_modal.location_types')}</Text>
            {LOCATION_ROWS.map((row) => (
              <FilterRow
                key={row.key}
                label={row.label}
                dotColor={row.color}
                value={draft[row.key]}
                onToggle={() => toggle(row.key)}
                isLocation
              />
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
            <Text style={styles.applyTxt}>{t('map_filter_modal.apply')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function FilterRow({
  label,
  dotColor,
  value,
  onToggle,
  isLocation,
}: {
  label: string;
  dotColor: string;
  value: boolean;
  onToggle: () => void;
  isLocation?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <View style={rowStyles.row}>
      {isLocation ? (
        <Ionicons name="location-outline" size={18} color={dotColor} style={{ marginRight: 12 }} />
      ) : (
        <View style={[rowStyles.dot, { backgroundColor: dotColor }]} />
      )}
      <Text style={[rowStyles.label, { color: theme.body }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.divider, true: Colors.indigo }}
        thumbColor={Colors.white}
        ios_backgroundColor={theme.divider}
      />
    </View>
  );
}

import React from 'react';
import { useTranslation } from 'react-i18next';

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: '#111827',
  },
});

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
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
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
    marginBottom: 18,
  },
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize.xxl,
    color: Colors.black,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cloudBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.babyBlue,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightMidBlue,
    marginVertical: 16,
  },
  applyBtn: {
    backgroundColor: Colors.indigo,
    paddingVertical: 17,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: Colors.indigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  applyTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
});
