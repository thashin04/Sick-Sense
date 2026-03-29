import { useState, useRef } from 'react';
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

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Map'>;
};

// ─── Types ────────────────────────────────────────────────────────────────────

type MarkerType = 'pharmacy' | 'hospital' | 'testing-site';

interface MapMarker {
  id: string;
  name: string;
  type: MarkerType;
  coordinates: [number, number]; // [lng, lat]
}

// ─── Mock data (replace with real API responses) ──────────────────────────────

// Outbreak heatmap data — clustered around Mills 50, Orlando
const OUTBREAK_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { weight: 1.0 }, geometry: { type: 'Point', coordinates: [-81.3600, 28.5490] } },
    { type: 'Feature', properties: { weight: 0.95 }, geometry: { type: 'Point', coordinates: [-81.3612, 28.5482] } },
    { type: 'Feature', properties: { weight: 0.9 }, geometry: { type: 'Point', coordinates: [-81.3590, 28.5475] } },
    { type: 'Feature', properties: { weight: 0.88 }, geometry: { type: 'Point', coordinates: [-81.3605, 28.5510] } },
    { type: 'Feature', properties: { weight: 0.82 }, geometry: { type: 'Point', coordinates: [-81.3585, 28.5498] } },
    { type: 'Feature', properties: { weight: 0.78 }, geometry: { type: 'Point', coordinates: [-81.3618, 28.5505] } },
    { type: 'Feature', properties: { weight: 0.65 }, geometry: { type: 'Point', coordinates: [-81.3572, 28.5488] } },
    { type: 'Feature', properties: { weight: 0.55 }, geometry: { type: 'Point', coordinates: [-81.3638, 28.5468] } },
    { type: 'Feature', properties: { weight: 0.42 }, geometry: { type: 'Point', coordinates: [-81.3595, 28.5528] } },
    { type: 'Feature', properties: { weight: 0.30 }, geometry: { type: 'Point', coordinates: [-81.3628, 28.5522] } },
    { type: 'Feature', properties: { weight: 0.25 }, geometry: { type: 'Point', coordinates: [-81.3558, 28.5478] } },
    { type: 'Feature', properties: { weight: 0.20 }, geometry: { type: 'Point', coordinates: [-81.3650, 28.5495] } },
  ],
};

const ALL_MARKERS: MapMarker[] = [
  { id: 'cvs-mills', name: 'CVS Pharmacy', type: 'pharmacy', coordinates: [-81.3680, 28.5600] },
  { id: 'adventhealth', name: 'AdventHealth', type: 'hospital', coordinates: [-81.3462, 28.5238] },
  { id: 'walgreens', name: 'Walgreens', type: 'pharmacy', coordinates: [-81.3540, 28.5540] },
  { id: 'testing-site-1', name: 'Testing Site', type: 'testing-site', coordinates: [-81.3720, 28.5420] },
];

const MILLS50_DETAIL: AreaDetail = {
  name: 'Mills 50',
  city: 'Orlando',
  state: 'FL',
  riskScore: 7.2,
  riskLevel: 'High',
  transmissionRate: 1.38,
  alerts: [
    { name: 'Strep Throat', description: 'Rapid spread detected in schools', severity: 'high' },
    { name: 'Common Cold', description: 'Standard seasonal elevation', severity: 'medium' },
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
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [selectedArea] = useState<AreaDetail>(MILLS50_DETAIL);
  const [areaDetailOpen, setAreaDetailOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const visibleMarkers = ALL_MARKERS.filter((m) => markerVisible(m.type, filters));

  return (
    <View style={styles.root}>
      {/* ── Search bar ── */}
      <SafeAreaView edges={['top']} style={styles.searchSafe}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search neighborhood or city..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
          </View>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFilterOpen(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={20} color={Colors.indigo} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── Map ── */}
      <View style={styles.mapContainer}>
        <MapboxGL.MapView
          style={StyleSheet.absoluteFillObject}
          styleURL="mapbox://styles/mapbox/light-v11"
          compassEnabled={false}
          scaleBarEnabled={false}
          logoEnabled={false}
          attributionEnabled={false}
        >
          <MapboxGL.Camera
            centerCoordinate={[-81.3600, 28.5490]}
            zoomLevel={13}
            animationMode="none"
          />

          {/* Heatmap outbreak layer */}
          <MapboxGL.ShapeSource id="outbreak-source" shape={OUTBREAK_GEOJSON}>
            <MapboxGL.HeatmapLayer
              id="outbreak-heat"
              sourceID="outbreak-source"
              style={{
                heatmapWeight: [
                  'interpolate',
                  ['linear'],
                  ['get', 'weight'],
                  0, 0,
                  1, 1,
                ],
                heatmapIntensity: 1.8,
                heatmapColor: [
                  'interpolate',
                  ['linear'],
                  ['heatmap-density'],
                  0,   'rgba(33, 102, 172, 0)',
                  0.1, 'rgba(103, 169, 207, 0.4)',
                  0.3, 'rgba(59, 200, 120, 0.7)',
                  0.5, 'rgba(230, 214, 50, 0.85)',
                  0.7, 'rgba(243, 130, 50, 0.9)',
                  1.0, 'rgba(200, 30, 30, 1)',
                ],
                heatmapRadius: 55,
                heatmapOpacity: 0.85,
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
          style={styles.infoCard}
          activeOpacity={0.9}
          onPress={() => setAreaDetailOpen(true)}
        >
          <View style={styles.infoCardLeft}>
            <Text style={styles.infoAreaName}>{selectedArea.name}</Text>
            <Text style={styles.infoAreaSub}>
              {selectedArea.city}, {selectedArea.state}  •  Tap for details
            </Text>
            <View style={styles.infoMeta}>
              <View style={styles.riskDot} />
              <Text style={styles.infoRiskTxt}>High Risk</Text>
              <Text style={styles.infoDivider}>  |  </Text>
              <Text style={styles.infoAlertsTxt}>
                {selectedArea.alerts.length} Active Alerts
              </Text>
            </View>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: scoreColor(selectedArea.riskScore) }]}>
            <Text style={styles.scoreTxt}>{selectedArea.riskScore.toFixed(1)}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Tab Bar ── */}
      <SafeAreaView edges={['bottom']} style={styles.tabBarSafe}>
        <View style={styles.tabBar}>
          {[
            { icon: 'home-outline' as const, label: 'Home', active: false },
            { icon: 'map' as const, label: 'Map', active: true },
            { icon: 'trending-up-outline' as const, label: 'Advice', active: false },
            { icon: 'settings-outline' as const, label: 'Settings', active: false },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.label}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => {
                if (!tab.active) {
                  if (tab.label === 'Home') navigation.navigate('Dashboard');
                  if (tab.label === 'Advice') navigation.navigate('Advice');
                  if (tab.label === 'Settings') navigation.navigate('Settings');
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
