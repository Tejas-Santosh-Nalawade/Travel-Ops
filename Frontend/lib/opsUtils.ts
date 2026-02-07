// Utility functions for Operations Dashboard

import { supabase } from '../lib/supabase';

/**
 * Format currency values
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format date and time
 */
export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

/**
 * Format date only
 */
export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
};

/**
 * Get status color class name
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-500',
    PENDING: 'bg-yellow-500',
    CONFIRMED: 'bg-green-500',
    FAILED: 'bg-red-500',
    ON_HOLD: 'bg-orange-500',
    CANCELLED: 'bg-gray-700',
    OPEN: 'bg-red-500',
    IN_PROGRESS: 'bg-yellow-500',
    RESOLVED: 'bg-green-500',
    MITIGATING: 'bg-orange-500',
    LOW: 'bg-green-500',
    MEDIUM: 'bg-yellow-500',
    HIGH: 'bg-red-500',
    SUCCESS: 'bg-green-500',
    SENT: 'bg-blue-500',
    ACKNOWLEDGED: 'bg-green-500',
  };
  return colors[status] || 'bg-gray-500';
};

/**
 * Get journey statistics
 */
export const getJourneyStats = async () => {
  const { data, error } = await supabase
    .from('journeys')
    .select('status, total_cost');

  if (error) throw error;

  const stats = {
    total: data.length,
    draft: data.filter((j) => j.status === 'DRAFT').length,
    pending: data.filter((j) => j.status === 'PENDING').length,
    confirmed: data.filter((j) => j.status === 'CONFIRMED').length,
    failed: data.filter((j) => j.status === 'FAILED').length,
    onHold: data.filter((j) => j.status === 'ON_HOLD').length,
    cancelled: data.filter((j) => j.status === 'CANCELLED').length,
    totalRevenue: data.reduce((sum, j) => sum + (j.total_cost || 0), 0),
  };

  return stats;
};

/**
 * Calculate total exposure for a journey
 */
export const calculateJourneyExposure = async (journeyId: string) => {
  const { data, error } = await supabase
    .from('journey_items')
    .select('cost, status')
    .eq('journey_id', journeyId);

  if (error) throw error;

  const confirmed = data
    .filter((item) => item.status === 'CONFIRMED')
    .reduce((sum, item) => sum + (item.cost || 0), 0);

  const pending = data
    .filter((item) => item.status === 'PENDING')
    .reduce((sum, item) => sum + (item.cost || 0), 0);

  return { confirmed, pending, total: confirmed + pending };
};

/**
 * Determine risk level based on amount
 */
export const calculateRiskLevel = (
  confirmedAmount: number,
  pendingAmount: number
): 'LOW' | 'MEDIUM' | 'HIGH' => {
  const total = confirmedAmount + pendingAmount;

  if (total > 5000 || pendingAmount > 3000) return 'HIGH';
  if (total > 2000 || pendingAmount > 1000) return 'MEDIUM';
  return 'LOW';
};

/**
 * Update journey status
 */
export const updateJourneyStatus = async (
  journeyId: string,
  newStatus: string
) => {
  const { data, error } = await supabase
    .from('journeys')
    .update({ status: newStatus })
    .eq('id', journeyId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Create an ops alert
 */
export const createOpsAlert = async (
  journeyId: string,
  alertType: string,
  message?: string
) => {
  const { data, error } = await supabase
    .from('ops_alerts')
    .insert({
      journey_id: journeyId,
      alert_type: alertType,
      status: 'OPEN',
      message,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Resolve an alert
 */
export const resolveAlert = async (alertId: string) => {
  const { data, error } = await supabase
    .from('ops_alerts')
    .update({
      status: 'RESOLVED',
      resolved_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Log an ops action
 */
export const logOpsAction = async (
  journeyId: string,
  action: string,
  status: 'SUCCESS' | 'FAILED' = 'SUCCESS'
) => {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('ops_actions')
    .insert({
      journey_id: journeyId,
      action,
      status,
      executed_by: userData?.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Create or update money exposure
 */
export const updateMoneyExposure = async (
  journeyId: string,
  confirmedAmount: number,
  pendingAmount: number
) => {
  const riskLevel = calculateRiskLevel(confirmedAmount, pendingAmount);

  // Try to update existing record first
  const { data: existing } = await supabase
    .from('money_exposure')
    .select('id')
    .eq('journey_id', journeyId)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('money_exposure')
      .update({
        confirmed_amount: confirmedAmount,
        pending_amount: pendingAmount,
        risk_level: riskLevel,
      })
      .eq('journey_id', journeyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('money_exposure')
      .insert({
        journey_id: journeyId,
        confirmed_amount: confirmedAmount,
        pending_amount: pendingAmount,
        risk_level: riskLevel,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

/**
 * Get active alerts count
 */
export const getActiveAlertsCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('ops_alerts')
    .select('*', { count: 'exact', head: true })
    .in('status', ['OPEN', 'IN_PROGRESS']);

  if (error) throw error;
  return count || 0;
};

/**
 * Get open incidents count
 */
export const getOpenIncidentsCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('incidents')
    .select('*', { count: 'exact', head: true })
    .in('status', ['OPEN', 'MITIGATING']);

  if (error) throw error;
  return count || 0;
};

/**
 * Calculate total system exposure
 */
export const getTotalExposure = async () => {
  const { data, error } = await supabase
    .from('money_exposure')
    .select('confirmed_amount, pending_amount');

  if (error) throw error;

  const total = data.reduce(
    (acc, exp) => ({
      confirmed: acc.confirmed + (exp.confirmed_amount || 0),
      pending: acc.pending + (exp.pending_amount || 0),
    }),
    { confirmed: 0, pending: 0 }
  );

  return {
    ...total,
    total: total.confirmed + total.pending,
  };
};

/**
 * Validate journey before confirmation
 */
export const validateJourney = async (journeyId: string) => {
  const issues: string[] = [];

  // Check if journey has items
  const { data: items, error: itemsError } = await supabase
    .from('journey_items')
    .select('*')
    .eq('journey_id', journeyId);

  if (itemsError) throw itemsError;

  if (!items || items.length === 0) {
    issues.push('Journey has no items');
  }

  // Check for failed items
  const failedItems = items?.filter((item) => item.status === 'FAILED');
  if (failedItems && failedItems.length > 0) {
    issues.push(`${failedItems.length} items have failed`);
  }

  // Check for pending items
  const pendingItems = items?.filter((item) => item.status === 'PENDING');
  if (pendingItems && pendingItems.length > 0) {
    issues.push(`${pendingItems.length} items are still pending`);
  }

  // Check for active alerts
  const { data: alerts, error: alertsError } = await supabase
    .from('ops_alerts')
    .select('*')
    .eq('journey_id', journeyId)
    .eq('status', 'OPEN');

  if (alertsError) throw alertsError;

  if (alerts && alerts.length > 0) {
    issues.push(`${alerts.length} unresolved alerts`);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
};

/**
 * Format journey item type
 */
export const formatItemType = (type: string): string => {
  return type.charAt(0) + type.slice(1).toLowerCase();
};

/**
 * Get severity color for risk level
 */
export const getRiskColor = (riskLevel: string): string => {
  const colors: Record<string, string> = {
    LOW: '#10B981',
    MEDIUM: '#F59E0B',
    HIGH: '#EF4444',
  };
  return colors[riskLevel] || '#6B7280';
};

/**
 * Short ID generator (first 8 chars of UUID)
 */
export const shortId = (id: string): string => {
  return id.slice(0, 8);
};

/**
 * Batch update journey items status
 */
export const batchUpdateItemsStatus = async (
  journeyId: string,
  newStatus: string
) => {
  const { data, error } = await supabase
    .from('journey_items')
    .update({ status: newStatus })
    .eq('journey_id', journeyId)
    .select();

  if (error) throw error;
  return data;
};

/**
 * Export utilities as default
 */
export default {
  formatCurrency,
  formatDateTime,
  formatDate,
  formatRelativeTime,
  getStatusColor,
  getJourneyStats,
  calculateJourneyExposure,
  calculateRiskLevel,
  updateJourneyStatus,
  createOpsAlert,
  resolveAlert,
  logOpsAction,
  updateMoneyExposure,
  getActiveAlertsCount,
  getOpenIncidentsCount,
  getTotalExposure,
  validateJourney,
  formatItemType,
  getRiskColor,
  shortId,
  batchUpdateItemsStatus,
};
