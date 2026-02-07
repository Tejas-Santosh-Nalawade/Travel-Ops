import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
// import { supabase } from '../lib/supabase'; // Uncomment when Supabase is initialized

export default function IncidentManagement() {
  // Logic for architecture items: supplier outage, price spikes, degradation 
  const [incidents] = useState([
    { id: '1', type: 'Supplier Outage', detail: 'API Provider Alpha Offline', severity: 'High' },
    { id: '2', type: 'Price Spike', detail: '25% increase detected in Flight Route X', severity: 'Medium' },
    { id: '3', type: 'System Degradation', detail: 'Rule Engine latency > 500ms', severity: 'Low' },
  ]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Active Incidents</Text>
      <FlatList
        data={incidents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { borderLeftColor: item.severity === 'High' ? '#ef4444' : '#f59e0b' }]}>
            <Text style={styles.type}>{item.type}</Text>
            <Text style={styles.detail}>{item.detail}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.severity}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, borderLeftWidth: 5, elevation: 1 },
  type: { fontWeight: 'bold', fontSize: 16 },
  detail: { color: '#475569', marginTop: 4 },
  badge: { alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: '#f1f5f9' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#475569' }
});