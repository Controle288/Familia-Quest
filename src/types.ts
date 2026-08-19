export type ProfileRole = 'parent' | 'child';

export type TaskStatus = 'pending' | 'waiting_approval' | 'completed';

export type RewardType = 'xp_and_money' | 'xp_only' | 'money_only';

export type TaskCategory = 'cleaning' | 'study' | 'pet' | 'kitchen' | 'personal' | 'custom';

export type RewardCategory = 'entertainment' | 'food' | 'activity' | 'gift' | 'custom';

export interface User {
  id: string;
  name: string;
  email: string;
  role: ProfileRole;
  family_id: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  user_id?: string;
  family_id: string;
  name: string;
  full_name: string;
  role: ProfileRole;
  avatar_url: string;
  title?: string;
  level: number;
  xp: number;
  xp_base: number;
  xp_to_next_level: number;
  balance: number;
  streak_days: number;
  created_at: string;
}

export interface Family {
  id: string;
  name: string;
  invite_code: string;
  created_by?: string;
  created_at?: string;
}

export interface Task {
  id: string;
  family_id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  icon_name: string;
  assigned_to: string; // profile_id or user_id
  created_by?: string; // profile_id of parent
  points: number; // XP points
  reward_value: number; // alias for points
  reward_type: RewardType;
  reward_money?: number; // R$ amount
  status: TaskStatus;
  due_date?: string;
  submitted_at?: string;
  approved_at?: string;
  proof_url?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface Reward {
  id: string;
  family_id: string;
  title: string;
  description: string;
  points_cost: number;
  money_cost: number;
  category: RewardCategory;
  image_url: string;
  is_available: boolean;
  created_at: string;
}

export interface Redemption {
  id: string;
  family_id: string;
  reward_id: string;
  reward_title: string;
  profile_id: string;
  profile_name: string;
  points_spent: number;
  status: 'requested' | 'approved' | 'delivered';
  created_at: string;
}

export interface ActivityLog {
  id: string;
  family_id: string;
  profile_id: string;
  profile_name: string;
  type: 'task_completed' | 'task_approved' | 'task_rejected' | 'reward_redeemed' | 'level_up' | 'allowance';
  title: string;
  points_change: number;
  money_change?: number;
  created_at: string;
}

export type ActiveTab = 'quest' | 'shop' | 'social' | 'stats';
export type ParentSubTab = 'pendentes' | 'gerenciar' | 'loja';

