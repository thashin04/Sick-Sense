import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapboxGL from '@rnmapbox/maps';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AreaDetailModal, { AreaDetail } from '../components/modals/AreaDetailModal';
import MapFilterModal, { MapFilters } from '../components/modals/MapFilterModal';
import { Colors, FontFamily, FontSize } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { useAppTheme } from '../hooks/useAppTheme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Map'>;
};

// ─── Types ────────────────────────────────────────────────────────────────────

type MarkerType = 'pharmacy' | 'hospital' | 'testing-site';

interface MapMarker {
  id: string;
  name: string;
  type: MarkerType;
  city: string;
  coordinates: [number, number]; // [lng, lat]
}

// ─── Initial Data ──────────────────────────────────────────────────────────────
const EMPTY_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

// ─── Constants ────────────────────────────────────────────────────────────────
const INITIAL_COORDS: [number, number] = [-82.4572, 27.9506]; // Tampa Center


const TAMPA_DEFAULT: AreaDetail = {
  name: 'Tampa',
  city: 'Tampa',
  state: 'FL',
  riskScore: 10.0,
  riskLevel: 'High',
  transmissionRate: 1.45,
  alerts: [
    { name: 'Influenza A', description: 'Surge detected in Hillsborough County', severity: 'high' },
    { name: 'Common Cold', description: 'Seasonal elevation', severity: 'medium' },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: MapFilters = {
  highRisk: true,
  mediumRisk: true,
  lowRisk: true,
  pharmacies: true,
  hospitals: true,
  testingSites: true,
};

function markerColor(type: MarkerType): string {
  if (type === 'pharmacy') return '#22C55E';
  if (type === 'hospital') return Colors.indigo;
  return Colors.sunlight;
}

function markerVisible(type: MarkerType, filters: MapFilters): boolean {
  if (type === 'pharmacy') return filters.pharmacies;
  if (type === 'hospital') return filters.hospitals;
  if (type === 'testing-site') return filters.testingSites;
  return true;
}

function scoreColor(score: number) {
  if (score >= 7) return Colors.coral;
  if (score >= 4) return Colors.sunlight;
  return '#22C55E';
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MapScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [selectedArea, setSelectedArea] = useState<AreaDetail>(TAMPA_DEFAULT);
  const [areaDetailOpen, setAreaDetailOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [heatmapData, setHeatmapData] = useState<GeoJSON.FeatureCollection>(EMPTY_GEOJSON);

  const visibleMarkers = markers.filter((m) => markerVisible(m.type, filters));

  React.useEffect(() => {
    async function fetchMapData() {
      try {
        const [locRes, heatRes] = await Promise.all([
          fetch('http://localhost:8000/api/locations'),
          fetch('http://localhost:8000/api/map/heatmap')
        ]);
        
        if (locRes.ok) {
          const locData = await locRes.json();
          setMarkers(locData);
        }
        
        if (heatRes.ok) {
          const heatData = await heatRes.json();
          setHeatmapData(heatData);
          
          // Set initial detailed area from the first city found (usually Tampa)
          if (heatData.features && heatData.features.length > 0) {
            const firstFeature = heatData.features[0].properties;
            setSelectedArea({
              name: firstFeature.city,
              city: firstFeature.city,
              state: firstFeature.state || 'FL',
              riskScore: firstFeature.risk_score || 0,
              riskLevel: firstFeature.risk_level || 'Low',
              transmissionRate: 1.0 + (firstFeature.weight * 0.5),
              alerts: firstFeature.alerts || [],
            });
          }
        }
      } catch (err) {
        console.error('[Map] Failed to fetch data:', err);
      }
    }
    fetchMapData();
  }, []);

  const handleHeatmapPress = (event: any) => {
    if (event.features && event.features.length > 0) {
      const featureData = event.features[0].properties;
      setSelectedArea({
        name: featureData.city,
        city: featureData.city,
        state: featureData.state || 'FL',
        riskScore: featureData.risk_score || 0,
        riskLevel: featureData.risk_level || 'Low',
        transmissionRate: 1.0 + (featureData.weight * 0.5),
        alerts: featureData.alerts || [],
      });
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* ── Search bar ── */}
      <SafeAreaView edges={['top']} style={[styles.searchSafe, { backgroundColor: theme.tabBar }]}>
        <View style={[styles.searchRow, { backgroundColor: theme.tabBar }]}>
          <View style={[styles.searchBar, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, borderWidth: 1 }]}>
            <Ionicons name="search-outline" size={18} color={theme.placeholderColor} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: theme.inputText }]}
              placeholder={t('map.search_placeholder')}
              placeholderTextColor={theme.placeholderColor}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
          </View>
          <TouchableOpacity
            style={[styles.filterBtn, { backgroundColor: theme.surfaceModal }]}
            onPress={() => setFilterOpen(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={20} color={theme.isDark ? '#A3C7FF' : Colors.indigo} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── Map ── */}
      <View style={styles.mapContainer}>
        <MapboxGL.MapView
          style={StyleSheet.absoluteFillObject}
          styleURL={theme.isDark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11"}
          compassEnabled={false}
          scaleBarEnabled={false}
          logoEnabled={false}
          attributionEnabled={false}
        >
          <MapboxGL.Camera
            centerCoordinate={INITIAL_COORDS}
            zoomLevel={11}
            animationMode="none"
          />

          {/* Heat outbreak layer - "Total Saturation" Refined for Transparency */}
          <MapboxGL.ShapeSource 
            id="outbreak-source" 
            shape={heatmapData}
            onPress={handleHeatmapPress}
          >
            {/* 1. Atmospheric Glow - Huge regional cloud */}
            <MapboxGL.CircleLayer
              id="outbreak-heat-glow"
              sourceID="outbreak-source"
              style={{
                circleRadius: [
                  'interpolate',
                  ['exponential', 1.75],
                  ['zoom'],
                  8, 150, 
                  11, 450, 
                  14, 1200,
                ],
                circleColor: [
                  'interpolate',
                  ['linear'],
                  ['get', 'weight'],
                  0,    'rgba(34, 197, 94, 0)',
                  0.45, 'rgba(34, 197, 94, 0.4)', 
                  0.65, 'rgba(34, 197, 94, 0.6)', 
                  0.82, 'rgba(234, 179, 8, 0.7)', 
                  0.95, 'rgba(239, 68, 68, 0.8)', 
                ],
                circleBlur: 0.9, 
                circleOpacity: 0.55,
              }}
            />
            
            {/* 2. Solid City Mass - Heavy "blob" of heat */}
            <MapboxGL.CircleLayer
              id="outbreak-heat-mass"
              sourceID="outbreak-source"
              style={{
                circleRadius: [
                  'interpolate',
                  ['exponential', 1.75],
                  ['zoom'],
                  8, 60, 
                  11, 240, 
                  14, 700,
                ],
                circleColor: [
                  'interpolate',
                  ['linear'],
                  ['get', 'weight'],
                  0,    'rgba(34, 197, 94, 0)',
                  0.5,  'rgba(34, 197, 94, 0.75)', 
                  0.75, 'rgba(234, 179, 8, 0.85)', 
                  0.9,  'rgba(239, 68, 68, 0.95)',  
                ],
                circleBlur: 0.45, 
                circleOpacity: 0.65,
              }}
            />
            
            {/* 3. Nuclear Epicenter - Core now allows labels to show through */}
            <MapboxGL.CircleLayer
              id="outbreak-heat-core"
              sourceID="outbreak-source"
              style={{
                circleRadius: [
                  'interpolate',
                  ['exponential', 1.75],
                  ['zoom'],
                  8, 25, 
                  11, 100, 
                  14, 350,
                ],
                circleColor: [
                  'interpolate',
                  ['linear'],
                  ['get', 'weight'],
                  0,    'rgba(34, 197, 94, 0)',
                  0.5,  'rgba(34, 197, 94, 0.85)', 
                  0.75, 'rgba(234, 179, 8, 0.9)', 
                  0.9,  'rgba(239, 68, 68, 0.95)', 
                ],
                circleBlur: 0.35, 
                circleOpacity: 0.65,
              }}
            />
          </MapboxGL.ShapeSource>

          {/* Location markers */}
          {visibleMarkers.map((marker) => (
            <MapboxGL.PointAnnotation
              key={marker.id}
              id={marker.id}
              coordinate={marker.coordinates}
              onSelected={() => {
                // TODO: update selectedArea and open detail on marker press
              }}
            >
              <View style={styles.markerWrap}>
                <View style={[styles.markerPin, { backgroundColor: markerColor(marker.type) }]} />
              </View>
              <MapboxGL.Callout title={marker.name} />
            </MapboxGL.PointAnnotation>
          ))}
        </MapboxGL.MapView>

        {/* ── Bottom info card ── */}
        <TouchableOpacity
          style={[styles.infoCard, { backgroundColor: theme.surface, shadowColor: theme.shadowColor }]}
          activeOpacity={0.9}
          onPress={() => setAreaDetailOpen(true)}
        >
          <View style={styles.infoCardLeft}>
            <Text style={[styles.infoAreaName, { color: theme.subheading }]}>{selectedArea.name}</Text>
            <Text style={[styles.infoAreaSub, { color: theme.muted }]}>
              {selectedArea.city}, {selectedArea.state}  •  {t('map.tap_for_details')}
            </Text>
            <View style={styles.infoMeta}>
              <View style={styles.riskDot} />
              <Text style={styles.infoRiskTxt}>{t('map.high_risk')}</Text>
              <Text style={[styles.infoDivider, { color: theme.divider }]}>  |  </Text>
              <Text style={[styles.infoAlertsTxt, { color: theme.body }]}>
                {t('map.active_alerts', { count: selectedArea.alerts.length })}
              </Text>
            </View>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: scoreColor(selectedArea.riskScore) }]}>
            <Text style={styles.scoreTxt}>{selectedArea.riskScore.toFixed(1)}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Tab Bar ── */}
      <SafeAreaView edges={['bottom']} style={[styles.tabBarSafe, { backgroundColor: theme.tabBar }]}>
        <View style={[styles.tabBar, { backgroundColor: theme.tabBar, borderTopColor: theme.tabBarBorder }]}>
          {[
            { icon: 'home-outline' as const, key: 'Home', label: t('tabs.home'), active: false },
            { icon: 'map' as const, key: 'Map', label: t('tabs.map'), active: true },
            { icon: 'trending-up-outline' as const, key: 'Advice', label: t('tabs.advice'), active: false },
            { icon: 'settings-outline' as const, key: 'Settings', label: t('tabs.settings'), active: false },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => {
                if (!tab.active) {
                  if (tab.key === 'Home') navigation.navigate('Dashboard');
                  if (tab.key === 'Advice') navigation.navigate('Advice');
                  if (tab.key === 'Settings') navigation.navigate('Settings');
                }
              }}
            >
              <View style={[tab.active ? styles.tabIconActive : styles.tabIconInactive, tab.active && { backgroundColor: theme.primary }]}>
                <Ionicons name={tab.icon} size={22} color={tab.active ? theme.primaryText : theme.tabIconInactive} />
              </View>
              <Text style={[styles.tabLabel, { color: theme.tabIconInactive }, tab.active && { color: theme.primary, fontFamily: FontFamily.semiBold }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {/* ── Modals ── */}
      <AreaDetailModal
        visible={areaDetailOpen}
        onClose={() => setAreaDetailOpen(false)}
        area={selectedArea}
      />
      <MapFilterModal
        visible={filterOpen}
        filters={filters}
        onApply={setFilters}
        onClose={() => setFilterOpen(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cloudBlue,
  },

  // Search
  searchSafe: {
    backgroundColor: Colors.white,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: Colors.white,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: '#111827',
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.cloudBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Map
  mapContainer: {
    flex: 1,
    position: 'relative',
  },

  // Marker
  markerWrap: {
    alignItems: 'center',
  },
  markerPin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },

  // Bottom info card
  infoCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  infoCardLeft: { flex: 1 },
  infoAreaName: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize.xxl,
    color: Colors.indigo,
    marginBottom: 2,
  },
  infoAreaSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#6B7280',
    marginBottom: 8,
  },
  infoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.coral,
    marginRight: 6,
  },
  infoRiskTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.coral,
  },
  infoDivider: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#D1D5DB',
  },
  infoAlertsTxt: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#374151',
  },
  scoreBadge: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },
  scoreTxt: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize.lg,
    color: Colors.white,
  },

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
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabIconActive: {
    width: 48,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconInactive: {
    width: 48,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#9CA3AF',
  },
  tabLabelActive: {
    fontFamily: FontFamily.semiBold,
    color: Colors.indigo,
  },
});
