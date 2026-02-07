import { supabase } from './supabase';

export type UserRole = 'agent' | 'ops' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

/**
 * Get the current user's profile including role
 * Falls back to user metadata if profiles table doesn't exist
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    // Try to get from profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      // FALLBACK: If profiles table doesn't exist, use user metadata (silently)
      const roleFromMetadata = user.user_metadata?.role || 'ops';
      
      return {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        role: roleFromMetadata as UserRole,
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
      };
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    
    // Last resort fallback: return agent role
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          role: 'agent',
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at,
        };
      }
    } catch {
      // Ignore
    }
    
    return null;
  }
}

/**
 * Get the current user's role
 */
export async function getUserRole(): Promise<UserRole | null> {
  const profile = await getUserProfile();
  return profile?.role || null;
}

/**
 * Get the dashboard path for a given role
 */
export function getDashboardPath(role: UserRole): string {
  const dashboardPaths: Record<UserRole, string> = {
    agent: '/(agent)/dashboard',
    ops: '/(ops)/dashboard',
    admin: '/(admin)/dashboard',
  };
  
  return dashboardPaths[role];
}

/**
 * Create or update user profile
 */
export async function createUserProfile(
  userId: string,
  email: string,
  fullName: string,
  role: UserRole
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name: fullName,
        role,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    return null;
  }
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) {
      console.error('Error updating role:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    return false;
  }
}

/**
 * Check if user has required role
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const userRole = await getUserRole();
  return userRole === requiredRole;
}

/**
 * Check if user has any of the required roles
 */
export async function hasAnyRole(requiredRoles: UserRole[]): Promise<boolean> {
  const userRole = await getUserRole();
  return userRole ? requiredRoles.includes(userRole) : false;
}

/**
 * Parse role from route parameter
 */
export function parseRoleFromParam(roleParam: string | undefined): UserRole {
  if (!roleParam) return 'agent';
  
  const cleaned = roleParam.replace(/[()]/g, '').toLowerCase();
  
  if (cleaned === 'ops' || cleaned === 'admin' || cleaned === 'agent') {
    return cleaned as UserRole;
  }
  
  return 'agent';
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    agent: 'Travel Agent',
    ops: 'Operations',
    admin: 'Administrator',
  };
  
  return displayNames[role];
}
