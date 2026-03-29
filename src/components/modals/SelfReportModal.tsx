import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize } from '../../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type ReportType = 'feeling-sick' | 'people-sick' | 'empty-shelves' | null;
type LocationType = 'my-location' | 'search-location';

export default function SelfReportModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const [reportType, setReportType] = useState<ReportType>(null);
  const [locationType, setLocationType] = useState<LocationType>('search-location');
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const REPORT_OPTIONS = [
    {
      id: 'feeling-sick' as ReportType,
      label: t('self_report.feeling_sick_label'),
      sub: t('self_report.feeling_sick_sub'),
      icon: 'alert-circle-outline' as const,
      iconBg: '#FDECEA',
      iconColor: Colors.coral,
    },
    {
      id: 'people-sick' as ReportType,
      label: t('self_report.people_sick_label'),
      sub: t('self_report.people_sick_sub'),
      icon: 'people-outline' as const,
      iconBg: '#FFF8E1',
      iconColor: '#C8860A',
    },
    {
      id: 'empty-shelves' as ReportType,
      label: t('self_report.empty_shelves_label'),
      sub: t('self_report.empty_shelves_sub'),
      icon: 'cart-outline' as const,
      iconBg: '#E8F5E9',
      iconColor: '#2E7D32',
    },
  ];

  const canContinue =
    reportType !== null &&
    (locationType === 'my-location' || search.trim().length > 0);

  function handleClose() {
    if (isSubmitting) return;
    setReportType(null);
    setLocationType('search-location');
    setSearch('');
    onClose();
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const finalLocation = locationType === 'my-location' ? 'Tampa' : search.trim();

      const res = await fetch('http://localhost:8000/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_type: reportType,
          location_type: locationType,
          location: finalLocation
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to submit report');
      }

      Alert.alert('Success', 'Thank you! Your report has been submitted anonymously.');
      handleClose();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>{t('self_report.title')}</Text>
                <Text style={styles.sheetSub}>
                  {t('self_report.subtitle')}
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View>
              {/* Report type options */}
              {REPORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.optionCard, reportType === opt.id && styles.optionCardSelected]}
                  onPress={() => setReportType(opt.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.optionIcon, { backgroundColor: opt.iconBg }]}>
                    <Ionicons name={opt.icon} size={22} color={opt.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionLabel}>{opt.label}</Text>
                    <Text style={styles.optionSub}>{opt.sub}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Location */}
              <Text style={styles.locationTitle}>{t('self_report.location_title')}</Text>
              <View style={styles.locationRow}>
                <TouchableOpacity
                  style={[
                    styles.locationBtn,
                    locationType === 'my-location' && styles.locationBtnSelected,
                  ]}
                  onPress={() => setLocationType('my-location')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.locationIconWrap, locationType === 'my-location' && styles.locationIconWrapSelected]}>
                    <Ionicons
                      name="location-outline"
                      size={22}
                      color={locationType === 'my-location' ? Colors.white : Colors.indigo}
                    />
                  </View>
                  <Text style={[styles.locationBtnTxt, locationType === 'my-location' && styles.locationBtnTxtSelected]}>
                    {t('self_report.my_location')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.locationBtn,
                    locationType === 'search-location' && styles.locationBtnSelected,
                  ]}
                  onPress={() => setLocationType('search-location')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.locationIconWrap, locationType === 'search-location' && styles.locationIconWrapSelected]}>
                    <Ionicons
                      name="search-outline"
                      size={22}
                      color={locationType === 'search-location' ? Colors.white : Colors.indigo}
                    />
                  </View>
                  <Text style={[styles.locationBtnTxt, locationType === 'search-location' && styles.locationBtnTxtSelected]}>
                    {t('self_report.search_location')}
                  </Text>
                </TouchableOpacity>
              </View>

              {locationType === 'search-location' && (
                <View style={styles.searchWrap}>
                  <Ionicons name="search-outline" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={t('self_report.search_placeholder')}
                    placeholderTextColor="#9CA3AF"
                    value={search}
                    onChangeText={setSearch}
                    autoCorrect={false}
                  />
                </View>
              )}
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.continueBtn, (!canContinue || isSubmitting) && styles.continueBtnDisabled]}
              disabled={!canContinue || isSubmitting}
              activeOpacity={0.85}
              onPress={handleSubmit}
            >
              <Text style={[styles.continueTxt, (!canContinue || isSubmitting) && styles.continueTxtDisabled]}>
                {isSubmitting ? 'Submitting...' : t('common.submit')}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize.xxl,
    color: Colors.black,
    marginBottom: 4,
  },
  sheetSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#6B7280',
    paddingRight: 12,
  },
  closeBtn: {
    marginTop: 2,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.lightMidBlue,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 14,
  },
  optionCardSelected: {
    borderColor: Colors.darkBlue,
    borderWidth: 2,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.black,
    marginBottom: 2,
  },
  optionSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: '#6B7280',
  },
  locationTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.black,
    marginTop: 6,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  locationBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.lightMidBlue,
    gap: 8,
  },
  locationBtnSelected: {
    borderColor: Colors.indigo,
    borderWidth: 2,
  },
  locationIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cloudBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIconWrapSelected: {
    backgroundColor: Colors.indigo,
  },
  locationBtnTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: '#374151',
    textAlign: 'center',
  },
  locationBtnTxtSelected: {
    color: Colors.indigo,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.lightMidBlue,
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: '#111827',
  },
  continueBtn: {
    backgroundColor: Colors.indigo,
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 16,
  },
  continueBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  continueTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
  continueTxtDisabled: {
    color: '#9CA3AF',
  },
});
