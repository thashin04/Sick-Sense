import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize } from '../../theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from '../../context/LocationContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SNAP_TOP = SCREEN_HEIGHT * 0.1; // 90% visible
const SNAP_MID = SCREEN_HEIGHT * 0.3; // 70% visible

// ─── Types ────────────────────────────────────────────────────────────────────

interface Provider {
  id: string;
  name: string;
  specialties: string[];
  address: string;
  phone: string;
  npi: string;
}

// ─── Props & Component ────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Insurance plan name from user profile — shown in header */
  insurancePlan?: string;
}

export default function InNetworkModal({ visible, onClose, insurancePlan = 'Your Plan' }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { selectedCity } = useLocation();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const lastPosition = useRef(SNAP_MID);

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: SNAP_MID,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90
      }).start();
      lastPosition.current = SNAP_MID;
      if (selectedCity) fetchProviders();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true
      }).start();
    }
  }, [visible, selectedCity]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await fetch(`http://localhost:8000/api/insurance/doctors?city=${encodeURIComponent(selectedCity || '')}`);
      if (!resp.ok) throw new Error('Search failed');
      const data = await resp.json();
      
      const mapped: Provider[] = data.map((d: any) => ({
        id: d.npi,
        name: d.name,
        specialties: d.specialties,
        address: d.address,
        phone: d.phone,
        npi: d.npi
      }));
      setProviders(mapped);
    } catch (err: any) {
      console.error('[InNetworkModal] Fetch Error:', err);
      setError(t('common.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        const newY = lastPosition.current + gestureState.dy;
        if (newY >= SNAP_TOP) translateY.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        const finalY = lastPosition.current + gestureState.dy;
        let target = SNAP_MID;
        if (finalY < SNAP_MID * 0.6) target = SNAP_TOP;
        else if (finalY > SNAP_MID * 1.3) {
          target = SCREEN_HEIGHT;
          onClose();
        }

        Animated.spring(translateY, {
          toValue: target,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90
        }).start();
        lastPosition.current = target;
      }
    })
  ).current;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* Backdrop - press to close */}
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose} 
        />
        
        {/* Sheet - non-touch-absorbing container */}
        <Animated.View 
          style={[
            styles.sheet, 
            { backgroundColor: theme.surfaceModal, shadowColor: theme.shadowColor, transform: [{ translateY }] }
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.dragArea}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.heading }]}>{t('in_network_modal.title')}</Text>
              <Text style={[styles.subtitle, { color: theme.muted }]}>
                {t('in_network_modal.subtitle', { plan: insurancePlan })}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={theme.muted} />
            </TouchableOpacity>
          </View>

          {/* Provider list */}
          <View style={styles.listContainer}>
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingTxt, { color: theme.muted }]}>Searching in {selectedCity}...</Text>
              </View>
            ) : error ? (
              <View style={styles.center}>
                <Ionicons name="alert-circle" size={48} color={theme.error} />
                <Text style={[styles.errorTxt, { color: theme.error }]}>{error}</Text>
                <TouchableOpacity style={[styles.retryBtn, { borderColor: theme.error }]} onPress={fetchProviders}>
                  <Text style={[styles.retryLabel, { color: theme.error }]}>{t('common.retry')}</Text>
                </TouchableOpacity>
              </View>
            ) : providers.length === 0 ? (
              <View style={styles.center}>
                <Ionicons name="search" size={48} color={theme.muted} />
                <Text style={[styles.emptyTxt, { color: theme.muted }]}>
                  No providers found in {selectedCity}
                </Text>
              </View>
            ) : (
              <ScrollView 
                showsVerticalScrollIndicator={false} 
                style={styles.list}
                contentContainerStyle={{ paddingBottom: 60 }}
              >
                {providers.map((p) => (
                  <View key={p.id} style={[styles.card, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.iconWrap, { backgroundColor: theme.surfaceTertiary }]}>
                        <Ionicons name="person" size={20} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.providerName, { color: theme.heading }]} numberOfLines={1}>
                          {p.name}
                        </Text>
                        <Text style={[styles.specialty, { color: theme.body }]}>
                          {p.specialties?.join(', ') || 'Medical Professional'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.addressRow}>
                      <Ionicons name="location-outline" size={16} color={theme.primary} />
                      <Text style={[styles.addressTxt, { color: theme.body }]} numberOfLines={2}>
                        {p.address}
                      </Text>
                    </View>

                    <View style={styles.cardFooter}>
                      <View style={[styles.statusPill, { backgroundColor: theme.surfaceSuccess }]}>
                        <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
                        <Text style={[styles.statusTxt, { color: theme.success }]}>In-Network</Text>
                      </View>
                      
                      <TouchableOpacity 
                        style={[styles.callBtn, { borderColor: theme.primary }]}
                        onPress={() => p.phone && Linking.openURL(`tel:${p.phone}`)}
                      >
                        <Ionicons name="call-outline" size={14} color={theme.primary} />
                        <Text style={[styles.callTxt, { color: theme.primary }]}>{t('common.call')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingTop: 12,
    paddingBottom: 40,
    height: SCREEN_HEIGHT,
  },
  dragArea: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingTxt: {
    marginTop: 12,
    fontFamily: FontFamily.regular,
    fontSize: 14,
  },
  errorTxt: {
    marginTop: 12,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  retryLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
  },
  emptyTxt: {
    marginTop: 12,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  providerName: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    marginBottom: 2,
  },
  specialty: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  addressTxt: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusTxt: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1.5,
    gap: 6,
  },
  callTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.indigo,
  },
});
