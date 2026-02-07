import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string | number;
  valueColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  iconColor,
  label,
  value,
  valueColor = 'text-gray-800',
}) => {
  return (
    <View className="bg-white rounded-lg p-4 shadow-md">
      <View className="flex-row items-center mb-2">
        <Ionicons name={icon} size={24} color={iconColor} />
        <Text className="ml-2 text-gray-600 text-sm">{label}</Text>
      </View>
      <Text className={`text-3xl font-bold ${valueColor}`}>{value}</Text>
    </View>
  );
};

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusColor = (status: string) => {
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

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-2 text-sm',
  };

  return (
    <View className={`${getStatusColor(status)} ${sizeClasses[size]} rounded-full`}>
      <Text className="text-white font-semibold">{status}</Text>
    </View>
  );
};

interface AlertCardProps {
  title: string;
  subtitle?: string;
  status: string;
  timestamp?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  title,
  subtitle,
  status,
  timestamp,
  onPrimaryAction,
  onSecondaryAction,
  primaryActionLabel = 'Start Work',
  secondaryActionLabel = 'Resolve',
  icon = 'alert-circle',
}) => {
  return (
    <View className="bg-white rounded-lg p-4 mb-2 shadow-sm">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 flex-row items-start">
          <Ionicons name={icon} size={24} color="#EF4444" />
          <View className="ml-3 flex-1">
            <Text className="font-semibold text-gray-800">{title}</Text>
            {subtitle && <Text className="text-sm text-gray-600">{subtitle}</Text>}
            {timestamp && <Text className="text-xs text-gray-400 mt-1">{timestamp}</Text>}
          </View>
        </View>
        <StatusBadge status={status} />
      </View>
      {(onPrimaryAction || onSecondaryAction) && (
        <View className="flex-row gap-2 mt-2">
          {onPrimaryAction && (
            <TouchableOpacity
              className="bg-blue-500 px-4 py-2 rounded-md flex-1"
              onPress={onPrimaryAction}
            >
              <Text className="text-white text-center text-sm font-semibold">
                {primaryActionLabel}
              </Text>
            </TouchableOpacity>
          )}
          {onSecondaryAction && (
            <TouchableOpacity
              className="bg-green-500 px-4 py-2 rounded-md flex-1"
              onPress={onSecondaryAction}
            >
              <Text className="text-white text-center text-sm font-semibold">
                {secondaryActionLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'information-circle',
  title,
  subtitle,
}) => {
  return (
    <View className="bg-gray-50 rounded-lg p-8 items-center">
      <Ionicons name={icon} size={48} color="#9CA3AF" />
      <Text className="text-gray-500 text-center mt-4 font-semibold">{title}</Text>
      {subtitle && <Text className="text-gray-400 text-center mt-2 text-sm">{subtitle}</Text>}
    </View>
  );
};

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionLabel,
  onActionPress,
}) => {
  return (
    <View className="flex-row justify-between items-center mb-3">
      <View className="flex-1">
        <Text className="text-xl font-bold text-gray-800">{title}</Text>
        {subtitle && <Text className="text-sm text-gray-600 mt-1">{subtitle}</Text>}
      </View>
      {actionLabel && onActionPress && (
        <TouchableOpacity onPress={onActionPress} className="ml-2">
          <Text className="text-blue-500 font-semibold">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface InfoRowProps {
  label: string;
  value: string | number;
  valueColor?: string;
}

export const InfoRow: React.FC<InfoRowProps> = ({
  label,
  value,
  valueColor = 'text-gray-800',
}) => {
  return (
    <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
      <Text className="text-sm text-gray-600">{label}</Text>
      <Text className={`text-sm font-semibold ${valueColor}`}>{value}</Text>
    </View>
  );
};

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
}) => {
  const variantClasses = {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-500',
    danger: 'bg-red-500',
    success: 'bg-green-500',
  };

  return (
    <TouchableOpacity
      className={`${variantClasses[variant]} px-4 py-3 rounded-lg flex-row items-center justify-center ${
        disabled ? 'opacity-50' : ''
      }`}
      onPress={onPress}
      disabled={disabled}
    >
      {icon && <Ionicons name={icon} size={18} color="white" />}
      <Text className={`text-white font-semibold ${icon ? 'ml-2' : ''}`}>{label}</Text>
    </TouchableOpacity>
  );
};
