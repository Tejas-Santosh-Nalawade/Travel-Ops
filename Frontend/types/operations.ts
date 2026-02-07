// Database Types for Operations Dashboard

export type JourneyStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'ON_HOLD'
  | 'CANCELLED';

export type JourneyItemType = 'FLIGHT' | 'HOTEL' | 'TRANSFER';

export type JourneyItemStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export type AlertType = 'BOOKING_FAILURE' | 'PRICE_SPIKE' | 'SUPPLIER_OUTAGE';

export type AlertStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export type IncidentType =
  | 'SUPPLIER_OUTAGE'
  | 'PAYMENT_FAILURE'
  | 'PRICE_SPIKE'
  | 'SYSTEM_DEGRADATION';

export type IncidentStatus = 'OPEN' | 'MITIGATING' | 'RESOLVED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type DecisionType = 'RETRY' | 'REPLACE' | 'ROLLBACK' | 'HOLD';

export type ActionStatus = 'SUCCESS' | 'FAILED';

export type NotificationStatus = 'SENT' | 'ACKNOWLEDGED';

export interface Journey {
  id: string;
  customer_name: string;
  created_by: string;
  status: JourneyStatus;
  total_cost: number;
  created_at: string;
}

export interface JourneyItem {
  id: string;
  journey_id: string;
  type: JourneyItemType;
  status: JourneyItemStatus;
  cost: number;
  details: Record<string, any>;
}

export interface MoneyExposure {
  id: string;
  journey_id: string;
  confirmed_amount: number;
  pending_amount: number;
  risk_level: RiskLevel;
  created_at: string;
}

export interface OpsAlert {
  id: string;
  journey_id: string;
  alert_type: AlertType;
  status: AlertStatus;
  created_at: string;
  journeys?: {
    customer_name: string;
  };
}

export interface OpsDecision {
  id: string;
  journey_id: string;
  decision: DecisionType;
  decided_by: string;
  notes: string;
  created_at: string;
  journeys?: {
    customer_name: string;
  };
}

export interface OpsAction {
  id: string;
  journey_id: string;
  action: string;
  status: ActionStatus;
  executed_at: string;
}

export interface Incident {
  id: string;
  incident_type: IncidentType;
  status: IncidentStatus;
  created_at: string;
}

export interface AdminNotification {
  id: string;
  incident_id: string;
  message: string;
  status: NotificationStatus;
  created_at: string;
}

export interface DashboardStats {
  totalJourneys: number;
  activeAlerts: number;
  openIncidents: number;
  totalExposure: number;
  highRiskJourneys: number;
  confirmedAmount: number;
  pendingAmount: number;
}
