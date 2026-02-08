/**
 * Audit Trail Viewer - Admin Dashboard
 * View complete, immutable history of journey modifications
 */
import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

type AuditEntry = {
  audit_id: string;
  audit_number: string;
  action_type: string;
  entity_type: string;
  version_number: number;
  changed_by_name: string;
  changed_by_role: string;
  change_reason: string;
  state_before: any;
  state_after: any;
  changes_summary: any;
  created_at: string;
};

export default function AuditTrail() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [journeyId, setJourneyId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const searchJourneyAudit = async () => {
    if (!journeyId.trim()) {
      Alert.alert('Missing Information', 'Please enter a journey ID');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_journey_audit_trail', {
        p_journey_id: journeyId,
        p_limit: 100,
      });

      if (error) throw error;
      setAuditEntries(data || []);

      if (!data || data.length === 0) {
        Alert.alert('No Results', 'No audit trail found for this journey ID');
      }
    } catch (error: any) {
      console.error('Error loading audit trail:', error);
      Alert.alert('Error', 'Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  const searchAllAudits = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Missing Information', 'Please enter a search term');
      return;
    }

    try {
      setLoading(true);
      // Search across all audit logs
      const { data, error } = await supabase
        .from('journey_audit_log')
        .select('*')
        .or(`audit_number.ilike.%${searchQuery}%,changed_by_name.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditEntries(data || []);

      if (!data || data.length === 0) {
        Alert.alert('No Results', 'No audit entries found matching your search');
      }
    } catch (error: any) {
      console.error('Error searching audit trail:', error);
      Alert.alert('Error', 'Failed to search audit trail');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return 'add-circle';
      case 'modified': return 'create';
      case 'cancelled': return 'close-circle';
      case 'deleted': return 'trash';
      case 'restored': return 'refresh-circle';
      default: return 'document';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'bg-green-500';
      case 'modified': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      case 'deleted': return 'bg-red-700';
      case 'restored': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const toggleExpanded = (auditId: string) => {
    setExpandedEntry(expandedEntry === auditId ? null : auditId);
  };

  const renderJsonDiff = (before: any, after: any) => {
    if (!before && !after) return null;

    const changes: Array<{key: string, before: any, after: any}> = [];

    if (after) {
      Object.keys(after).forEach(key => {
        if (before && JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
          changes.push({ key, before: before[key], after: after[key] });
        } else if (!before) {
          changes.push({ key, before: null, after: after[key] });
        }
      });
    }

    if (changes.length === 0) return null;

    return (
      <View className="mt-3">
        <Text className="text-sm font-bold text-gray-800 mb-2">Changes Detected:</Text>
        {changes.slice(0, 10).map((change, index) => (
          <View key={index} className="bg-gray-50 rounded-lg p-3 mb-2">
            <Text className="text-xs font-bold text-gray-700 mb-1 uppercase">{change.key}</Text>
            {change.before !== null && (
              <View className="flex-row items-start mb-1">
                <Text className="text-red-600 text-xs font-semibold mr-2">Before:</Text>
                <Text className="flex-1 text-gray-600 text-xs">
                  {typeof change.before === 'object'
                    ? JSON.stringify(change.before).substring(0, 100)
                    : String(change.before)}
                </Text>
              </View>
            )}
            <View className="flex-row items-start">
              <Text className="text-green-600 text-xs font-semibold mr-2">After:</Text>
              <Text className="flex-1 text-gray-900 text-xs font-bold">
                {typeof change.after === 'object'
                  ? JSON.stringify(change.after).substring(0, 100)
                  : String(change.after)}
              </Text>
            </View>
          </View>
        ))}
        {changes.length > 10 && (
          <Text className="text-xs text-gray-500 italic">
            ...and {changes.length - 10} more changes
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-teal-500 px-6 py-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-3xl font-extrabold text-white mb-1">
              Audit Trail Viewer
            </Text>
            <Text className="text-teal-100 text-sm">
              Immutable change history
            </Text>
          </View>
          <View className="bg-white/20 rounded-full p-2">
            <Ionicons name="shield-checkmark" size={24} color="#fff" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
        {/* Search by Journey ID */}
        <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Search by Journey ID
          </Text>
          <View className="flex-row items-center gap-3">
            <TextInput
              placeholder="Enter journey UUID"
              value={journeyId}
              onChangeText={setJourneyId}
              autoCapitalize="none"
              className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border-2 border-teal-200 text-gray-900 font-bold"
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity
              onPress={searchJourneyAudit}
              disabled={loading}
              className="bg-teal-500 rounded-xl px-4 py-3"
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="search" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search All Audits */}
        <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Search All Audit Logs
          </Text>
          <View className="flex-row items-center gap-3">
            <TextInput
              placeholder="Audit number or user name"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border-2 border-teal-200 text-gray-900 font-bold"
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity
              onPress={searchAllAudits}
              disabled={loading}
              className="bg-teal-500 rounded-xl px-4 py-3"
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="filter" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Audit Entries */}
        {auditEntries.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xl font-bold text-gray-800">
                Audit History
              </Text>
              <View className="bg-teal-100 px-3 py-1 rounded-full">
                <Text className="text-teal-700 font-bold text-sm">
                  {auditEntries.length} entries
                </Text>
              </View>
            </View>

            {auditEntries.map((entry, index) => (
              <View key={entry.audit_id} className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
                {/* Header */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <View className={`${getActionColor(entry.action_type)} rounded-full p-2 mr-2`}>
                        <Ionicons name={getActionIcon(entry.action_type) as any} size={18} color="#fff" />
                      </View>
                      <Text className="text-lg font-extrabold text-gray-900">
                        {entry.audit_number}
                      </Text>
                    </View>
                    <Text className="text-gray-600 capitalize">
                      {entry.action_type} - {entry.entity_type}
                    </Text>
                  </View>
                  <View className="bg-teal-100 px-3 py-1 rounded-full">
                    <Text className="text-teal-700 font-bold text-xs">
                      v{entry.version_number}
                    </Text>
                  </View>
                </View>

                {/* Metadata */}
                <View className="bg-gray-50 rounded-2xl p-4 mb-3">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="person" size={16} color="#6b7280" />
                    <Text className="ml-2 text-gray-700 font-semibold">
                      {entry.changed_by_name || 'System'}
                    </Text>
                    <View className="bg-gray-200 px-2 py-1 rounded ml-2">
                      <Text className="text-gray-600 text-xs uppercase font-bold">
                        {entry.changed_by_role}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="time" size={16} color="#6b7280" />
                    <Text className="ml-2 text-gray-600 text-sm">
                      {formatDate(entry.created_at)}
                    </Text>
                  </View>
                  {entry.change_reason && (
                    <View className="mt-2 bg-blue-50 rounded-lg p-2">
                      <Text className="text-blue-900 text-xs italic">
                        "{entry.change_reason}"
                      </Text>
                    </View>
                  )}
                </View>

                {/* Expand/Collapse Button */}
                <TouchableOpacity
                  onPress={() => toggleExpanded(entry.audit_id)}
                  className="flex-row items-center justify-center py-2"
                >
                  <Text className="text-teal-600 font-bold mr-2">
                    {expandedEntry === entry.audit_id ? 'Hide Details' : 'Show Details'}
                  </Text>
                  <Ionicons
                    name={expandedEntry === entry.audit_id ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#14b8a6"
                  />
                </TouchableOpacity>

                {/* Expanded Details */}
                {expandedEntry === entry.audit_id && (
                  <View className="mt-3 border-t border-gray-200 pt-3">
                    {/* Changes Summary */}
                    {entry.changes_summary && (
                      <View className="mb-3">
                        <Text className="text-sm font-bold text-gray-800 mb-2">Summary:</Text>
                        <View className="bg-yellow-50 rounded-lg p-3">
                          <Text className="text-gray-700 text-sm">
                            {JSON.stringify(entry.changes_summary, null, 2)}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Detailed Diff */}
                    {renderJsonDiff(entry.state_before, entry.state_after)}

                    {/* Raw Data Toggle */}
                    <View className="mt-3">
                      <Text className="text-xs font-bold text-gray-600 mb-2">Raw State Data:</Text>
                      {entry.state_before && (
                        <View className="bg-red-50 rounded-lg p-3 mb-2">
                          <Text className="text-red-700 font-bold text-xs mb-1">BEFORE:</Text>
                          <ScrollView horizontal>
                            <Text className="text-gray-600 text-xs font-mono">
                              {JSON.stringify(entry.state_before, null, 2).substring(0, 500)}...
                            </Text>
                          </ScrollView>
                        </View>
                      )}
                      {entry.state_after && (
                        <View className="bg-green-50 rounded-lg p-3">
                          <Text className="text-green-700 font-bold text-xs mb-1">AFTER:</Text>
                          <ScrollView horizontal>
                            <Text className="text-gray-900 text-xs font-mono">
                              {JSON.stringify(entry.state_after, null, 2).substring(0, 500)}...
                            </Text>
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Timeline Indicator */}
                {index < auditEntries.length - 1 && (
                  <View className="absolute left-6 top-full h-4 w-0.5 bg-teal-200" />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!loading && auditEntries.length === 0 && (journeyId || searchQuery) && (
          <View className="bg-white rounded-3xl p-12 items-center justify-center shadow-lg">
            <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-400 font-bold text-lg mt-4">No audit entries found</Text>
            <Text className="text-gray-400 text-center mt-2">
              Try searching with a different journey ID or query
            </Text>
          </View>
        )}

        {/* Instructions */}
        {!loading && auditEntries.length === 0 && !journeyId && !searchQuery && (
          <View className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-3xl p-8 shadow-lg">
            <View className="items-center mb-6">
              <View className="bg-teal-100 rounded-full p-4 mb-4">
                <Ionicons name="information-circle" size={48} color="#14b8a6" />
              </View>
              <Text className="text-2xl font-extrabold text-gray-900 mb-2">
                Audit Trail System
              </Text>
              <Text className="text-gray-600 text-center">
                Complete, immutable history of all journey modifications
              </Text>
            </View>

            <View className="space-y-3">
              <View className="flex-row items-start">
                <View className="bg-teal-500 rounded-full p-1 mr-3 mt-1">
                  <Ionicons name="shield-checkmark" size={16} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-bold mb-1">Immutable Records</Text>
                  <Text className="text-gray-600 text-sm">
                    Once created, audit entries cannot be modified or deleted
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View className="bg-teal-500 rounded-full p-1 mr-3 mt-1">
                  <Ionicons name="git-branch" size={16} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-bold mb-1">Version Control</Text>
                  <Text className="text-gray-600 text-sm">
                    Every change creates a new version with complete state snapshots
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View className="bg-teal-500 rounded-full p-1 mr-3 mt-1">
                  <Ionicons name="people" size={16} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-bold mb-1">Full Attribution</Text>
                  <Text className="text-gray-600 text-sm">
                    Track who made changes, when, and why
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View className="bg-teal-500 rounded-full p-1 mr-3 mt-1">
                  <Ionicons name="search" size={16} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-bold mb-1">Comprehensive Search</Text>
                  <Text className="text-gray-600 text-sm">
                    Search by journey ID, audit number, or user name
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
