import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize } from '../../theme';
import { useAppTheme } from '../../hooks/useAppTheme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Provider {
  id: string;
  name: string;
  specialty: string;
  type: 'hospital' | 'clinic' | 'urgent-care' | 'pharmacy';
  distance: string;
  address: string;
  phone: string;
  acceptingPatients: boolean;
}

// ─── Mock data (replace with backend response keyed to user's insurance plan) ─

const PROVIDERS: Provider[] = [
  {
    id: '1',
    name: 'AdventHealth Orlando',
    specialty: 'General Hospital',
    type: 'hospital',
    distance: '1.2 mi',
    address: '601 E Rollins St, Orlando, FL',
    phone: '4074547000',
    acceptingPatients: true,
  },
  {
    id: '2',
    name: 'Orlando Health Physician Group',
    specialty: 'Primary Care',
    type: 'clinic',
    distance: '0.8 mi',
    address: '52 W Underwood St, Orlando, FL',
    phone: '4078419100',
    acceptingPatients: true,
  },
  {
    id: '3',
    name: 'CareSpot Urgent Care – Mills Ave',
    specialty: 'Urgent Care',
    type: 'urgent-care',
    distance: '0.4 mi',
    address: '2106 N Mills Ave, Orlando, FL',
    phone: '4076450500',
    acceptingPatients: true,
  },
  {
    id: '4',
    name: 'Florida Hospital Medical Group',
    specialty: 'Family Medicine',
    type: 'clinic',
    distance: '2.1 mi',
    address: '900 Winderley Pl, Maitland, FL',
    phone: '4078963200',
    acceptingPatients: false,
  },
  {
    id: '5',
    name: 'CVS MinuteClinic',
    specialty: 'Walk-In Clinic',
    type: 'pharmacy',
    distance: '0.4 mi',
    address: '2204 E Colonial Dr, Orlando, FL',
    phone: '8664254747',
    acceptingPatients: true,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeIcon(type: Provider['type']): React.ComponentProps<typeof Ionicons>['name'] {
  if (type === 'hospital') return 'business-outline';
  if (type === 'urgent-care') return 'medkit-outline';
  if (type === 'pharmacy') return 'bag-outline';
  return 'person-outline';
}

function typeColor(type: Provider['type']): string {
  if (type === 'hospital') return Colors.indigo;
  if (type === 'urgent-care') return Colors.coral;
  if (type === 'pharmacy') return '#22C55E';
  return Colors.babyBlue;
}

function typeBg(type: Provider['type']): string {
  if (type === 'hospital') return Colors.cloudBlue;
  if (type === 'urgent-care') return '#FDECEA';
  if (type === 'pharmacy') return '#E8F5E9';
  return '#EEF2FF';
}

// ─── Props & Component ────────────────────────────────────────────────────────

import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Insurance plan name from user profile — shown in header */
  insurancePlan?: string;
  /** Current city for filtering */
  city?: string;
}

export default function InNetworkModal({ visible, onClose, insurancePlan, city }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [providers, setProviders] = React.useState<Provider[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Helper to map backend DoctorResponse to frontend Provider
  const mapDoctorToProvider = (doc: any): Provider => {
    // Heuristic for type based on name or specialty
    let type: Provider['type'] = 'clinic';
    const nameLower = doc.name.toLowerCase();
    const specLower = (doc.specialties[0] || '').toLowerCase();
    
    if (nameLower.includes('hospital')) type = 'hospital';
    else if (nameLower.includes('urgent') || specLower.includes('emergency')) type = 'urgent-care';
    else if (nameLower.includes('cvs') || nameLower.includes('walgreens') || nameLower.includes('pharmacy')) type = 'pharmacy';

    return {
      id: doc.npi || Math.random().toString(36).substr(2, 9),
      name: doc.name,
      specialty: doc.specialties.join(', '),
      type: type,
      distance: (Math.random() * 5).toFixed(1) + ' mi', // Randomized for demo
      address: doc.address || 'Address not listed',
      phone: doc.phone || '',
      acceptingPatients: true, // Standard assumption for search results
    };
  };

  React.useEffect(() => {
    if (!visible) return;

    async function fetchProviders() {
      if (!insurancePlan || insurancePlan === 'none') {
        setProviders([]);
        return;
      }

      setLoading(true);
      try {
        const url = `http://localhost:8000/api/doctors/search?provider=${encodeURIComponent(insurancePlan)}&city=${encodeURIComponent(city || 'Orlando')}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setProviders(data.map(mapDoctorToProvider));
        } else {
          console.error('[InNetwork] API error:', response.status);
        }
      } catch (e) {
        console.error('[InNetwork] Fetch failed:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchProviders();
  }, [visible, insurancePlan, city]);

  // Map the plan ID to a display name for the header
  const getPlanDisplayName = (id?: string) => {
    if (!id || id === 'none') return t('insurance.items.none');
    const items: Record<string, string> = {
      'florida-blue': 'Florida Blue',
      'aetna': 'Aetna',
      'unitedhealthcare': 'UnitedHealthcare',
      'cigna': 'Cigna',
      'humana': 'Humana',
      'medicaid': 'Medicaid',
      'medicare': 'Medicare',
      'ambetter': 'Ambetter',
      'molina': 'Molina Healthcare',
      'wellcare': 'WellCare'
    };
    return items[id] || id;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: theme.surfaceModal, shadowColor: theme.shadowColor }]}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.heading }]}>{t('in_network_modal.title')}</Text>
              <Text style={[styles.subtitle, { color: theme.muted }]}>
                {t('in_network_modal.subtitle', { plan: getPlanDisplayName(insurancePlan) })}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={theme.muted} />
            </TouchableOpacity>
          </View>

          {/* Provider list */}
          <View style={{ flex: 1 }}>
            {loading ? (
              <View style={styles.loadingArea}>
                <Text style={[styles.loadingTxt, { color: theme.muted }]}>Searching for providers...</Text>
              </View>
            ) : providers.length === 0 ? (
              <View style={styles.loadingArea}>
                <Ionicons name="search-outline" size={48} color={theme.border} style={{ marginBottom: 16 }} />
                <Text style={[styles.loadingTxt, { color: theme.muted }]}>
                  {insurancePlan === 'none' 
                    ? "No specific providers linked to your account." 
                    : "No providers found for your current plan in this area."}
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
                {providers.map((p) => (
                  <View key={p.id} style={[styles.card, { borderColor: theme.border }]}>
                    {/* Icon + name row */}
                    <View style={styles.cardHeader}>
                      <View style={[styles.iconWrap, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : typeBg(p.type) }]}>
                        <Ionicons name={typeIcon(p.type)} size={20} color={typeColor(p.type)} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.providerName, { color: theme.body }]}>{p.name}</Text>
                        <Text style={[styles.specialty, { color: theme.muted }]}>{p.specialty}</Text>
                      </View>
                      <View style={[styles.distancePill, { backgroundColor: theme.surfaceSecondary }]}>
                        <Text style={[styles.distanceTxt, { color: theme.isDark ? '#FFFFFF' : Colors.indigo }]}>{p.distance}</Text>
                      </View>
                    </View>

                    {/* Address */}
                    <View style={styles.addressRow}>
                      <Ionicons name="location-outline" size={13} color={theme.muted} />
                      <Text style={[styles.addressTxt, { color: theme.muted }]}>{p.address}</Text>
                    </View>

                    {/* Status + actions */}
                    <View style={styles.cardFooter}>
                      <View style={[styles.statusPill, { backgroundColor: p.acceptingPatients ? (theme.isDark ? 'rgba(34,197,94,0.12)' : '#F0FFF4') : (theme.isDark ? 'rgba(244,63,94,0.12)' : '#FEF2F2') }]}>
                        <View style={[styles.statusDot, { backgroundColor: p.acceptingPatients ? '#22C55E' : Colors.coral }]} />
                        <Text style={[styles.statusTxt, { color: p.acceptingPatients ? (theme.isDark ? '#86EFAC' : '#166534') : (theme.isDark ? '#FDA4AF' : '#991B1B') }]}>
                          {p.acceptingPatients ? t('in_network_modal.accepting') : t('in_network_modal.not_accepting')}
                        </Text>
                      </View>

                      {p.phone && p.phone !== 'Not Available' && (
                        <TouchableOpacity
                          style={[styles.callBtn, { borderColor: theme.border }]}
                          activeOpacity={0.8}
                          onPress={() => Linking.openURL(`tel:${p.phone}`)}
                        >
                          <Ionicons name="call-outline" size={14} color={theme.isDark ? '#A3C7FF' : Colors.indigo} />
                          <Text style={[styles.callTxt, { color: theme.isDark ? '#A3C7FF' : Colors.indigo }]}>{t('common.call')}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
                <View style={{ height: 16 }} />
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize.xl,
    color: Colors.indigo,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#6B7280',
  },
  planName: {
    fontFamily: FontFamily.semiBold,
    color: Colors.darkBlue,
  },
  list: { flex: 1 },
  card: {
    borderWidth: 1.5,
    borderColor: Colors.lightMidBlue,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerName: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.black,
    marginBottom: 1,
  },
  specialty: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: '#6B7280',
  },
  distancePill: {
    backgroundColor: Colors.cloudBlue,
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  distanceTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.indigo,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  addressTxt: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: '#9CA3AF',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: Colors.lightMidBlue,
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  callTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.indigo,
  },
  loadingArea: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTxt: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '80%',
  },
});
