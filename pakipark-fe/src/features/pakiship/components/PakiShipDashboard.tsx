import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  background: '#F1FAF8',
  card: '#FFFFFF',
  text: '#021B1A',
  subtle: '#6B7280',
  primary: '#39B5A8',
  accent: '#111827',
  border: '#E5ECEB',
  success: '#10B981',
  warning: '#F59E0B',
};

type Shipment = {
  id: string;
  trackingNo: string;
  sender: string;
  recipient: string;
  status: 'In Transit' | 'Pending' | 'Delivered';
  origin: string;
  destination: string;
  date: string;
};

const INITIAL_SHIPMENTS: Shipment[] = [
  {
    id: '1',
    trackingNo: 'PKSHIP-8274-PH',
    sender: 'Manila Warehouse',
    recipient: 'Juliana Alejo',
    status: 'In Transit',
    origin: 'Manila, NCR',
    destination: 'Quezon City, NCR',
    date: 'May 17, 2026',
  },
  {
    id: '2',
    trackingNo: 'PKSHIP-4910-PH',
    sender: 'Tech Supplier Co.',
    recipient: 'Juliana Alejo',
    status: 'Pending',
    origin: 'Cebu City, Cebu',
    destination: 'Pasig City, NCR',
    date: 'May 16, 2026',
  },
  {
    id: '3',
    trackingNo: 'PKSHIP-1029-PH',
    sender: 'PakiShip Logistics',
    recipient: 'Juliana Alejo',
    status: 'Delivered',
    origin: 'Davao City, Davao',
    destination: 'Manila, NCR',
    date: 'May 12, 2026',
  },
];

type PakiShipDashboardProps = {
  userName: string;
  onLogout: () => void;
};

export function PakiShipDashboard({ userName, onLogout }: PakiShipDashboardProps) {
  const [shipments, setShipments] = useState<Shipment[]>(INITIAL_SHIPMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [weight, setWeight] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);

  // Search filter
  const filteredShipments = shipments.filter(
    (s) =>
      s.trackingNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.recipient.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Cost calculator
  const calculateCost = () => {
    const numericWeight = parseFloat(weight);
    if (isNaN(numericWeight) || numericWeight <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight in kg.');
      return;
    }
    // Base P80 + P25 per kg
    const cost = 80 + numericWeight * 25;
    setEstimatedCost(cost);
  };

  const getStatusColor = (status: Shipment['status']) => {
    if (status === 'Delivered') return COLORS.success;
    if (status === 'Pending') return COLORS.warning;
    return COLORS.primary;
  };

  return (
    <View style={styles.container}>
      {/* Premium Glassmorphic Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>Welcome to PakiSHIP,</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <Pressable hitSlop={12} onPress={onLogout} style={styles.logoutButton}>
          <Feather name="log-out" size={18} color="#FF5A5A" />
        </Pressable>
      </View>

      <FlatList
        data={filteredShipments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.topSection}>
            {/* Quick Estimator Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                <MaterialCommunityIcons name="calculator-variant" size={18} color={COLORS.primary} />
                {'  '}Shipping Rate Estimator
              </Text>
              <Text style={styles.cardSubtitle}>
                Calculate instant shipping rates across all provinces.
              </Text>
              
              <View style={styles.calculatorRow}>
                <View style={styles.inputShell}>
                  <TextInput
                    style={styles.weightInput}
                    placeholder="Weight (kg)"
                    placeholderTextColor={COLORS.subtle}
                    keyboardType="numeric"
                    value={weight}
                    onChangeText={(val) => {
                      setWeight(val);
                      if (estimatedCost !== null) setEstimatedCost(null);
                    }}
                  />
                  <Text style={styles.weightLabel}>kg</Text>
                </View>

                <Pressable onPress={calculateCost} style={styles.calculateButton}>
                  <Text style={styles.calculateButtonText}>Calculate</Text>
                </Pressable>
              </View>

              {estimatedCost !== null && (
                <View style={styles.costBox}>
                  <Text style={styles.costLabel}>Estimated Charge:</Text>
                  <Text style={styles.costValue}>₱{estimatedCost.toFixed(2)}</Text>
                </View>
              )}
            </View>

            {/* Tracking Search Shell */}
            <View style={styles.searchBlock}>
              <Text style={styles.sectionTitle}>Active Shipments</Text>
              <View style={styles.searchBar}>
                <Feather name="search" size={16} color={COLORS.subtle} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Track by Number, Sender..."
                  placeholderTextColor={COLORS.subtle}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery !== '' && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Feather name="x" size={16} color={COLORS.subtle} />
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.shipmentCard}>
            <View style={styles.shipmentHeader}>
              <View style={styles.trackingBadge}>
                <Feather name="package" size={13} color={COLORS.primary} />
                <Text style={styles.trackingNo}>{item.trackingNo}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
              </View>
            </View>

            <View style={styles.routeRow}>
              <View style={styles.routePoint}>
                <View style={[styles.pointCircle, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.routeLabel}>{item.origin}</Text>
              </View>
              
              <View style={styles.connectorLine} />

              <View style={styles.routePoint}>
                <View style={[styles.pointCircle, { backgroundColor: COLORS.success }]} />
                <Text style={styles.routeLabel}>{item.destination}</Text>
              </View>
            </View>

            <View style={styles.shipmentFooter}>
              <View style={styles.metaRow}>
                <Feather name="calendar" size={12} color={COLORS.subtle} />
                <Text style={styles.metaText}>{item.date}</Text>
              </View>
              <View style={styles.metaRow}>
                <Feather name="user" size={12} color={COLORS.subtle} />
                <Text style={styles.metaText}>To: {item.recipient}</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={40} color={COLORS.subtle} />
            <Text style={styles.emptyText}>No shipments found matching search.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6ECEB',
    elevation: 2,
  },
  headerLeft: {
    gap: 2,
  },
  welcomeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.subtle,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  logoutButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topSection: {
    gap: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.subtle,
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 16,
  },
  calculatorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputShell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAF9',
  },
  weightInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 10,
    fontWeight: '700',
  },
  weightLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.subtle,
  },
  calculateButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calculateButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  costBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  costLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  costValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  searchBlock: {
    marginTop: 8,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    paddingVertical: 10,
  },
  shipmentCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  shipmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  trackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F8FAF9',
  },
  trackingNo: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  connectorLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 0.5,
    borderColor: COLORS.subtle,
    marginHorizontal: 10,
  },
  shipmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F8FAF9',
    paddingTop: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.subtle,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.subtle,
    fontWeight: '600',
    textAlign: 'center',
  },
});
