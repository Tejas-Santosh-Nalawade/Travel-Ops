// =============================================================================
// OPERATIONS API - Backend Function Wrappers
// Clean API layer for calling backend database functions
// =============================================================================

import { supabase } from './supabase';

// -----------------------------------------------------------------------------
// Statistics & Dashboards
// -----------------------------------------------------------------------------

/**
 * Get comprehensive operations statistics
 */
export async function getOperationsStatistics() {
  const { data, error } = await supabase.rpc('get_journey_statistics');
  
  if (error) {
    console.error('Error fetching operations statistics:', error);
    throw error;
  }
  
  return data[0] || {
    total_journeys: 0,
    confirmed_journeys: 0,
    failed_journeys: 0,
    pending_journeys: 0,
    on_hold_journeys: 0,
    total_revenue: 0,
    total_exposure: 0,
    high_risk_count: 0,
    active_alerts: 0,
    open_incidents: 0,
  };
}

/**
 * Get journeys requiring immediate attention
 */
export async function getCriticalJourneys() {
  const { data, error } = await supabase.rpc('get_critical_journeys');
  
  if (error) {
    console.error('Error fetching critical journeys:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get money exposure summary
 */
export async function getExposureSummary() {
  const { data, error } = await supabase.rpc('get_exposure_summary');
  
  if (error) {
    console.error('Error fetching exposure summary:', error);
    throw error;
  }
  
  return data[0] || {
    total_confirmed: 0,
    total_pending: 0,
    total_exposure: 0,
    high_risk_exposure: 0,
    medium_risk_exposure: 0,
    low_risk_exposure: 0,
    journey_count: 0,
  };
}

// -----------------------------------------------------------------------------
// Operations Actions
// -----------------------------------------------------------------------------

/**
 * Execute an operations decision (RETRY/REPLACE/ROLLBACK/HOLD)
 */
export async function executeOpsDecision(
  journeyId: string,
  decision: 'RETRY' | 'REPLACE' | 'ROLLBACK' | 'HOLD',
  decidedBy: string,
  notes?: string
) {
  const { data, error } = await supabase.rpc('execute_ops_decision', {
    p_journey_id: journeyId,
    p_decision: decision,
    p_decided_by: decidedBy,
    p_notes: notes || null,
  });
  
  if (error) {
    console.error('Error executing ops decision:', error);
    throw error;
  }
  
  return data;
}

/**
 * Create an alert for a journey
 */
export async function createAlert(
  journeyId: string,
  alertType: 'BOOKING_FAILURE' | 'PRICE_SPIKE' | 'SUPPLIER_OUTAGE',
  message?: string
) {
  const { data, error } = await supabase.rpc('auto_create_alert', {
    p_journey_id: journeyId,
    p_alert_type: alertType,
    p_message: message || null,
  });
  
  if (error) {
    console.error('Error creating alert:', error);
    throw error;
  }
  
  return data;
}

/**
 * Resolve an alert and optionally create incident
 */
export async function resolveAlert(
  alertId: string,
  createIncident: boolean = false,
  incidentDescription?: string
) {
  const { data, error } = await supabase.rpc('resolve_alert', {
    p_alert_id: alertId,
    p_create_incident: createIncident,
    p_incident_description: incidentDescription || null,
  });
  
  if (error) {
    console.error('Error resolving alert:', error);
    throw error;
  }
  
  return data;
}

/**
 * Calculate risk level for given exposure
 */
export async function calculateRiskLevel(
  confirmedAmount: number,
  pendingAmount: number,
  customerBudget: number
) {
  const { data, error } = await supabase.rpc('calculate_risk_level', {
    p_confirmed_amount: confirmedAmount,
    p_pending_amount: pendingAmount,
    p_customer_budget: customerBudget,
  });
  
  if (error) {
    console.error('Error calculating risk level:', error);
    throw error;
  }
  
  return data as 'LOW' | 'MEDIUM' | 'HIGH';
}

// -----------------------------------------------------------------------------
// Direct Database Operations (with proper error handling)
// -----------------------------------------------------------------------------

/**
 * Get all journeys with filters
 */
export async function getJourneys(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('journeys')
    .select('*, journey_items(*), money_exposure(*)')
    .order('created_at', { ascending: false });
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching journeys:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get alerts with optional filters
 */
export async function getAlerts(filters?: {
  status?: string;
  journeyId?: string;
}) {
  let query = supabase
    .from('ops_alerts')
    .select('*, journeys(customer_name)')
    .order('created_at', { ascending: false });
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters?.journeyId) {
    query = query.eq('journey_id', filters.journeyId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Update alert status
 */
export async function updateAlertStatus(
  alertId: string,
  newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
) {
  const { data, error } = await supabase
    .from('ops_alerts')
    .update({ status: newStatus })
    .eq('id', alertId)
    .select();
  
  if (error) {
    console.error('Error updating alert status:', error);
    throw error;
  }
  
  return data?.[0];
}

/**
 * Get incidents with filters
 */
export async function getIncidents(filters?: {
  status?: string;
  type?: string;
}) {
  let query = supabase
    .from('incidents')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters?.type) {
    query = query.eq('incident_type', filters.type);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching incidents:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Update incident status
 */
export async function updateIncidentStatus(
  incidentId: string,
  newStatus: 'OPEN' | 'MITIGATING' | 'RESOLVED'
) {
  const { data, error } = await supabase
    .from('incidents')
    .update({ status: newStatus })
    .eq('id', incidentId)
    .select();
  
  if (error) {
    console.error('Error updating incident status:', error);
    throw error;
  }
  
  return data?.[0];
}

/**
 * Get operations decisions with journey info
 */
export async function getDecisions(limit: number = 20) {
  const { data, error } = await supabase
    .from('ops_decisions')
    .select('*, journeys(customer_name, status)')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching decisions:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get money exposure for all journeys
 */
export async function getMoneyExposure(filters?: {
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}) {
  let query = supabase
    .from('money_exposure')
    .select('*, journeys(customer_name, status)')
    .order('risk_level', { ascending: false });
  
  if (filters?.riskLevel) {
    query = query.eq('risk_level', filters.riskLevel);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching money exposure:', error);
    throw error;
  }
  
  return data || [];
}

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    CONFIRMED: 'green',
    PENDING: 'yellow',
    FAILED: 'red',
    ON_HOLD: 'orange',
    CANCELLED: 'gray',
    DRAFT: 'blue',
    OPEN: 'purple',
    IN_PROGRESS: 'amber',
    RESOLVED: 'emerald',
    MITIGATING: 'orange',
  };
  return colors[status] || 'gray';
}

/**
 * Get risk level color
 */
export function getRiskColor(riskLevel: string): string {
  const colors: Record<string, string> = {
    HIGH: 'red',
    MEDIUM: 'yellow',
    LOW: 'green',
  };
  return colors[riskLevel] || 'gray';
}
