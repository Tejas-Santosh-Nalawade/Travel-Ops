import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SLAScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>SLA Compliance</Text>
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreLabel}>System Uptime</Text>
        <Text style={styles.scoreValue}>99.4%</Text>
      </View>
      
      <View style={styles.breachItem}>
        <Text style={styles.sectionTitle}>Recent Breaches</Text>
        <View style={styles.breachItem}>
          <Text style={styles.breachText}>Supplier Alpha: API Latency High</Text>
          <Text style={styles.breachTime}>Today, 14:20</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc', marginBottom: 20, marginTop: 40 },
  scoreContainer: { backgroundColor: '#334155', padding: 30, borderRadius: 24, alignItems: 'center', marginBottom: 30 },
  scoreLabel: { color: '#94a3b8', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  scoreValue: { color: '#22c55e', fontSize: 48, fontWeight: '900', marginTop: 10 },
  sectionTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700', marginBottom: 15 },
  breachItem: { borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingVertical: 12 },
  breachText: { color: '#cbd5e1', fontSize: 14 },
  breachTime: { color: '#64748b', fontSize: 12, marginTop: 4 }
});