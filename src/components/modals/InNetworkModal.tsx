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
}

export default function InNetworkModal({ visible, onClose, insurancePlan = 'Your Plan' }: Props) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t('in_network_modal.title')}</Text>
              <Text style={styles.subtitle}>
                {t('in_network_modal.subtitle', { plan: insurancePlan })}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Provider list */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
            {PROVIDERS.map((p) => (
              <View key={p.id} style={styles.card}>
                {/* Icon + name row */}
                <View style={styles.cardHeader}>
                  <View style={[styles.iconWrap, { backgroundColor: typeBg(p.type) }]}>
                    <Ionicons name={typeIcon(p.type)} size={20} color={typeColor(p.type)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.providerName}>{p.name}</Text>
                    <Text style={styles.specialty}>{p.specialty}</Text>
                  </View>
                  <View style={styles.distancePill}>
                    <Text style={styles.distanceTxt}>{p.distance}</Text>
                  </View>
                </View>

                {/* Address */}
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={13} color="#9CA3AF" />
                  <Text style={styles.addressTxt}>{p.address}</Text>
                </View>

                {/* Status + actions */}
                <View style={styles.cardFooter}>
                  <View style={[styles.statusPill, { backgroundColor: p.acceptingPatients ? '#F0FFF4' : '#FEF2F2' }]}>
                    <View style={[styles.statusDot, { backgroundColor: p.acceptingPatients ? '#22C55E' : Colors.coral }]} />
                    <Text style={[styles.statusTxt, { color: p.acceptingPatients ? '#166534' : '#991B1B' }]}>
                      {p.acceptingPatients ? t('in_network_modal.accepting') : t('in_network_modal.not_accepting')}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.callBtn}
                    activeOpacity={0.8}
                    onPress={() => Linking.openURL(`tel:${p.phone}`)}
                  >
                    <Ionicons name="call-outline" size={14} color={Colors.indigo} />
                    <Text style={styles.callTxt}>{t('common.call')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <View style={{ height: 16 }} />
          </ScrollView>
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
});
