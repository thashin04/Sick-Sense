import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize } from '../../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type ReportType = 'feeling-sick' | 'people-sick' | 'empty-shelves' | null;
type LocationType = 'my-location' | 'search-location';

const REPORT_OPTIONS = [
  {
    id: 'feeling-sick' as ReportType,
    label: "I'm feeling sick",
    sub: 'Report your symptoms to help track outbreaks',
    icon: 'alert-circle-outline' as const,
    iconBg: '#FDECEA',
    iconColor: Colors.coral,
  },
  {
    id: 'people-sick' as ReportType,
    label: 'People around me are sick',
    sub: 'Report illness in your household or workplace',
    icon: 'people-outline' as const,
    iconBg: '#FFF8E1',
    iconColor: '#C8860A',
  },
  {
    id: 'empty-shelves' as ReportType,
    label: "I'm seeing empty shelves",
    sub: 'Report medicine or supply shortages',
    icon: 'cart-outline' as const,
    iconBg: '#E8F5E9',
    iconColor: '#2E7D32',
  },
];

export default function SelfReportModal({ visible, onClose }: Props) {
  const [reportType, setReportType] = useState<ReportType>(null);
  const [locationType, setLocationType] = useState<LocationType>('search-location');
  const [search, setSearch] = useState('');

  const canContinue =
    reportType !== null &&
    (locationType === 'my-location' || search.trim().length > 0);

  function handleClose() {
    setReportType(null);
    setLocationType('search-location');
    setSearch('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Report Health Issue</Text>
                <Text style={styles.sheetSub}>
                  Help us track community health by reporting what you're experiencing.
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
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
              <Text style={styles.locationTitle}>Report Location</Text>
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
                    My Location
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
                    Search Location
                  </Text>
                </TouchableOpacity>
              </View>

              {locationType === 'search-location' && (
                <View style={styles.searchWrap}>
                  <Ionicons name="search-outline" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Enter city or zip code..."
                    placeholderTextColor="#9CA3AF"
                    value={search}
                    onChangeText={setSearch}
                    autoCorrect={false}
                  />
                </View>
              )}

              <TouchableOpacity
                style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
                disabled={!canContinue}
                activeOpacity={0.85}
                onPress={() => {
                  // TODO: submit report to backend
                  handleClose();
                }}
              >
                <Text style={[styles.continueTxt, !canContinue && styles.continueTxtDisabled]}>
                  Continue
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
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
    maxHeight: '90%',
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
    marginTop: 4,
    marginBottom: 4,
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
