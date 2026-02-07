import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from "react-native-safe-area-context";

export default function RuleEngine() {
  const activeRules = [
    { id: '1', name: 'Auto-Retry Failure', status: 'Active', icon: 'refresh', executions: '1.2k', lastRun: '2m ago' },
    { id: '2', name: 'Price Spike Threshold', status: 'Active', icon: 'trending-up', executions: '847', lastRun: '5m ago' },
    { id: '3', name: 'SLA Escalation Trigger', status: 'Paused', icon: 'alarm', executions: '523', lastRun: '1h ago' },
  ];

  const getStatusStyle = (status: string) => ({
    backgroundColor: status === 'Active' ? '#dcfce7' : '#fef3c7',
    color: status === 'Active' ? '#166534' : '#92400e',
    dotColor: status === 'Active' ? '#22c55e' : '#f59e0b',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Stats */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Rule Engine</Text>
            <Text style={styles.subtitle}>
              Automate decisions & system behavior
            </Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Paused</Text>
            </View>
          </View>
        </View>

        {/* Rule Cards */}
        {activeRules.map((rule, index) => {
          const statusStyle = getStatusStyle(rule.status);

          return (
            <TouchableOpacity 
              key={rule.id} 
              activeOpacity={0.7}
              style={[
                styles.card,
                { transform: [{ scale: 1 }] }
              ]}
            >
              <LinearGradient
                colors={['#ffffff', '#fafafa']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                {/* Top Row */}
                <View style={styles.cardTop}>
                  <View style={styles.left}>
                    <View style={[styles.iconWrap, { 
                      backgroundColor: index % 3 === 0 ? '#dbeafe' : index % 3 === 1 ? '#fce7f3' : '#e0e7ff'
                    }]}>
                      <MaterialIcons 
                        name={rule.icon as any} 
                        size={22} 
                        color={index % 3 === 0 ? '#2563eb' : index % 3 === 1 ? '#db2777' : '#7c3aed'} 
                      />
                    </View>

                    <View style={styles.ruleInfo}>
                      <Text style={styles.ruleName}>{rule.name}</Text>
                      <View style={styles.metaRow}>
                        <View style={[styles.statusPill, { backgroundColor: statusStyle.backgroundColor }]}>
                          <View style={[styles.statusDot, { backgroundColor: statusStyle.dotColor }]} />
                          <Text style={[styles.statusText, { color: statusStyle.color }]}>
                            {rule.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.settingsBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Bottom Stats Row */}
                <View style={styles.cardBottom}>
                  <View style={styles.miniStat}>
                    <Ionicons name="pulse-outline" size={14} color="#64748b" />
                    <Text style={styles.miniStatText}>{rule.executions} runs</Text>
                  </View>
                  <View style={styles.miniStat}>
                    <Ionicons name="time-outline" size={14} color="#64748b" />
                    <Text style={styles.miniStatText}>{rule.lastRun}</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}

        {/* CTA Button */}
        <TouchableOpacity activeOpacity={0.85} style={styles.addButtonWrapper}>
          <LinearGradient
            colors={['#3b82f6', '#2563eb', '#1d4ed8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButton}
          >
            <View style={styles.addButtonContent}>
              <View style={styles.addIconCircle}>
                <Ionicons name="add" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.addButtonText}>Create New Rule</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },

  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },

  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
  },

  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '600',
  },

  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',

    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,

    // Android shadow
    elevation: 3,
  },

  cardGradient: {
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  left: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },

  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  ruleInfo: {
    flex: 1,
  },

  ruleName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    letterSpacing: -0.3,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 6,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  settingsBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },

  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 14,
  },

  cardBottom: {
    flexDirection: 'row',
    gap: 20,
  },

  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  miniStatText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },

  addButtonWrapper: {
    marginHorizontal: 20,
    marginTop: 8,
  },

  addButton: {
    borderRadius: 16,
    overflow: 'hidden',
    
    // Enhanced shadow
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },

  addButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },

  addIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});