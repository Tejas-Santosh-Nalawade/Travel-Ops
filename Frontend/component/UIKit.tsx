// Professional UI Component Library for TravelOps
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// ==================== STATUS BADGES ====================
export const StatusBadge = ({ status, size = 'md' }: { status: string; size?: 'sm' | 'md' | 'lg' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'CONFIRMED':
      case 'SUCCESS':
      case 'COMPLETED':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'checkmark-circle' as const, color: '#059669' };
      case 'PENDING':
      case 'IN_PROGRESS':
        return { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'time' as const, color: '#d97706' };
      case 'FAILED':
      case 'ERROR':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: 'close-circle' as const, color: '#dc2626' };
      case 'ON_HOLD':
      case 'PAUSED':
        return { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'pause-circle' as const, color: '#ea580c' };
      case 'CANCELLED':
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: 'ban' as const, color: '#6b7280' };
      case 'DRAFT':
        return { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'document-text' as const, color: '#2563eb' };
      case 'OPEN':
        return { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'alert-circle' as const, color: '#9333ea' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: 'ellipse' as const, color: '#6b7280' };
    }
  };

  const config = getStatusConfig();
  const sizeClasses = { sm: 'px-2 py-1', md: 'px-3 py-1.5', lg: 'px-4 py-2' };
  const textSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };
  const iconSize = { sm: 12, md: 14, lg: 16 };

  return (
    <View className={`${config.bg} ${sizeClasses[size]} rounded-full flex-row items-center`}>
      <Ionicons name={config.icon} size={iconSize[size]} color={config.color} />
      <Text className={`${config.text} ${textSize[size]} font-semibold ml-1`}>{status}</Text>
    </View>
  );
};

// ==================== STAT CARDS ====================
export const StatCard = ({ 
  title, 
  value, 
  icon, 
  iconColor = '#3b82f6',
  iconBg = 'bg-blue-100',
  trend,
  subtitle 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
}) => (
  <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
    <View className="flex-row items-start justify-between mb-3">
      <View className={`w-12 h-12 rounded-xl ${iconBg} items-center justify-center`}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      {trend && (
        <View className={`px-2 py-1 rounded-lg ${trend.isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
          <Text className={`text-xs font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </Text>
        </View>
      )}
    </View>
    <Text className="text-2xl font-bold text-gray-900 mb-1">{value}</Text>
    <Text className="text-sm text-gray-600">{title}</Text>
    {subtitle && <Text className="text-xs text-gray-400 mt-1">{subtitle}</Text>}
  </View>
);

// ==================== PROGRESS STEPPER ====================
export const ProgressStepper = ({ 
  steps, 
  currentStep 
}: { 
  steps: { label: string; status: 'completed' | 'current' | 'pending' | 'failed' }[]; 
  currentStep: number;
}) => (
  <View className="py-4">
    {steps.map((step, index) => {
      const isLast = index === steps.length - 1;
      const getStatusColor = () => {
        switch (step.status) {
          case 'completed': return { bg: 'bg-green-500', text: 'text-green-700', icon: 'checkmark' as const };
          case 'current': return { bg: 'bg-blue-500', text: 'text-blue-700', icon: 'ellipse' as const };
          case 'failed': return { bg: 'bg-red-500', text: 'text-red-700', icon: 'close' as const };
          default: return { bg: 'bg-gray-300', text: 'text-gray-500', icon: 'ellipse' as const };
        }
      };
      const status = getStatusColor();

      return (
        <View key={index} className="flex-row items-start">
          <View className="items-center mr-3">
            <View className={`w-8 h-8 rounded-full ${status.bg} items-center justify-center`}>
              <Ionicons name={status.icon} size={16} color="white" />
            </View>
            {!isLast && (
              <View className={`w-0.5 h-12 ${step.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'} mt-1`} />
            )}
          </View>
          <View className="flex-1 pb-3">
            <Text className={`font-semibold ${status.text}`}>{step.label}</Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              {step.status === 'completed' && 'Completed'}
              {step.status === 'current' && 'In Progress...'}
              {step.status === 'failed' && 'Failed - Ops Handling'}
              {step.status === 'pending' && 'Waiting...'}
            </Text>
          </View>
        </View>
      );
    })}
  </View>
);

// ==================== RISK INDICATOR ====================
export const RiskIndicator = ({ level }: { level: 'LOW' | 'MEDIUM' | 'HIGH' }) => {
  const config = {
    LOW: { color: 'bg-green-500', text: 'Low Risk', textColor: 'text-green-700' },
    MEDIUM: { color: 'bg-amber-500', text: 'Medium Risk', textColor: 'text-amber-700' },
    HIGH: { color: 'bg-red-500', text: 'High Risk', textColor: 'text-red-700' }
  }[level];

  return (
    <View className="flex-row items-center">
      <View className="flex-row mr-2">
        {['LOW', 'MEDIUM', 'HIGH'].map((l, i) => (
          <View
            key={l}
            className={`w-1.5 h-6 mx-0.5 rounded-full ${
              level === 'HIGH' || (level === 'MEDIUM' && i <= 1) || (level === 'LOW' && i === 0)
                ? config.color
                : 'bg-gray-200'
            }`}
          />
        ))}
      </View>
      <Text className={`text-sm font-semibold ${config.textColor}`}>{config.text}</Text>
    </View>
  );
};

// ==================== MONEY DISPLAY ====================
export const MoneyDisplay = ({ 
  amount, 
  label, 
  size = 'md',
  showCurrency = true 
}: { 
  amount: number; 
  label?: string; 
  size?: 'sm' | 'md' | 'lg';
  showCurrency?: boolean;
}) => {
  const textSizes = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' };
  const labelSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

  return (
    <View>
      <Text className={`${textSizes[size]} font-bold text-gray-900`}>
        {showCurrency && '₹'}{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Text>
      {label && <Text className={`${labelSizes[size]} text-gray-500 mt-1`}>{label}</Text>}
    </View>
  );
};

// ==================== ACTION BUTTON ====================
export const ActionButton = ({
  title,
  onPress,
  icon,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false
}: {
  title: string;
  onPress: () => void;
  icon?: any;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}) => {
  const variants = {
    primary: 'bg-blue-600 border-blue-600',
    secondary: 'bg-gray-100 border-gray-300',
    success: 'bg-green-600 border-green-600',
    danger: 'bg-red-600 border-red-600',
    ghost: 'bg-transparent border-gray-300'
  };

  const textColors = {
    primary: 'text-white',
    secondary: 'text-gray-700',
    success: 'text-white',
    danger: 'text-white',
    ghost: 'text-gray-700'
  };

  const sizes = { sm: 'px-3 py-2', md: 'px-4 py-3', lg: 'px-6 py-4' };
  const textSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };
  const iconSizes = { sm: 18, md: 20, lg: 24 };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${variants[variant]} ${sizes[size]} rounded-xl border flex-row items-center justify-center ${
        disabled ? 'opacity-50' : ''
      }`}
      activeOpacity={0.8}
    >
      {icon && !loading && <Ionicons name={icon} size={iconSizes[size]} color={textColors[variant].includes('white') ? 'white' : '#374151'} />}
      {loading && <Ionicons name="sync" size={iconSizes[size]} color={textColors[variant].includes('white') ? 'white' : '#374151'} />}
      <Text className={`${textColors[variant]} ${textSizes[size]} font-semibold ${icon || loading ? 'ml-2' : ''}`}>
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
};

// ==================== INFO CARD ====================
export const InfoCard = ({ 
  title, 
  children, 
  icon, 
  action 
}: { 
  title: string; 
  children: React.ReactNode; 
  icon?: any;
  action?: { label: string; onPress: () => void };
}) => (
  <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
    <View className="flex-row items-center justify-between mb-3">
      <View className="flex-row items-center">
        {icon && (
          <View className="w-10 h-10 rounded-lg bg-blue-50 items-center justify-center mr-3">
            <Ionicons name={icon} size={20} color="#3b82f6" />
          </View>
        )}
        <Text className="text-lg font-bold text-gray-900">{title}</Text>
      </View>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text className="text-blue-600 font-semibold text-sm">{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
    {children}
  </View>
);

// ==================== EMPTY STATE ====================
export const EmptyState = ({ 
  icon, 
  title, 
  subtitle, 
  action 
}: { 
  icon: any; 
  title: string; 
  subtitle?: string; 
  action?: { label: string; onPress: () => void };
}) => (
  <View className="items-center justify-center py-12 px-6">
    <View className="w-20 h-20 rounded-full bg-gray-50 items-center justify-center mb-4">
      <Ionicons name={icon} size={40} color="#d1d5db" />
    </View>
    <Text className="text-lg font-semibold text-gray-700 mb-2">{title}</Text>
    {subtitle && <Text className="text-sm text-gray-500 text-center mb-4">{subtitle}</Text>}
    {action && (
      <TouchableOpacity onPress={action.onPress} className="bg-blue-600 px-6 py-3 rounded-xl">
        <Text className="text-white font-semibold">{action.label}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ==================== ALERT CARD ====================
export const AlertCard = ({ 
  type = 'info', 
  title, 
  message,
  action 
}: { 
  type?: 'info' | 'warning' | 'error' | 'success'; 
  title: string; 
  message: string;
  action?: { label: string; onPress: () => void };
}) => {
  const config = {
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'information-circle' as const, iconColor: '#3b82f6', textColor: 'text-blue-900' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'warning' as const, iconColor: '#f59e0b', textColor: 'text-amber-900' },
    error: { bg: 'bg-red-50', border: 'border-red-200', icon: 'alert-circle' as const, iconColor: '#ef4444', textColor: 'text-red-900' },
    success: { bg: 'bg-green-50', border: 'border-green-200', icon: 'checkmark-circle' as const, iconColor: '#10b981', textColor: 'text-green-900' }
  }[type];

  return (
    <View className={`${config.bg} ${config.border} border rounded-xl p-4 flex-row items-start mb-4`}>
      <Ionicons name={config.icon} size={24} color={config.iconColor} />
      <View className="ml-3 flex-1">
        <Text className={`font-semibold ${config.textColor} mb-1`}>{title}</Text>
        <Text className={`text-sm ${config.textColor} opacity-80`}>{message}</Text>
        {action && (
          <TouchableOpacity onPress={action.onPress} className="mt-3 self-start">
            <Text className="text-sm font-semibold" style={{ color: config.iconColor }}>
              {action.label}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ==================== SECTION HEADER ====================
export const SectionHeader = ({ 
  title, 
  subtitle, 
  action 
}: { 
  title: string; 
  subtitle?: string; 
  action?: { label: string; onPress: () => void };
}) => (
  <View className="flex-row items-center justify-between mb-3">
    <View>
      <Text className="text-lg font-bold text-gray-900">{title}</Text>
      {subtitle && <Text className="text-sm text-gray-500 mt-0.5">{subtitle}</Text>}
    </View>
    {action && (
      <TouchableOpacity onPress={action.onPress}>
        <Text className="text-blue-600 font-semibold">{action.label}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ==================== GRADIENT HEADER ====================
export const GradientHeader = ({ 
  title, 
  subtitle, 
  colors = ['#3b82f6', '#2563eb'],
  icon 
}: { 
  title: string; 
  subtitle?: string; 
  colors?: [string, string, ...string[]];
  icon?: any;
}) => (
  <LinearGradient colors={colors} className="px-6 pt-8 pb-6 rounded-b-3xl">
    <View className="flex-row items-center">
      {icon && (
        <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-4">
          <Ionicons name={icon} size={24} color="white" />
        </View>
      )}
      <View className="flex-1">
        <Text className="text-2xl font-bold text-white">{title}</Text>
        {subtitle && <Text className="text-white/80 text-sm mt-1">{subtitle}</Text>}
      </View>
    </View>
  </LinearGradient>
);
