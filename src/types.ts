export type ProfileRole = 'parent' | 'child';

export type RelationshipType = 'mae' | 'pai' | 'avo' | 'outro' | 'filho';

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
  relationship?: RelationshipType;
  age?: number;
  avatar_url: string;
  title?: string;
  level: number;
  xp: number;
  xp_base: number;
  xp_to_next_level: number;
  balance: number;
  streak_days: number;
  last_active?: string;
  financial_goal?: { name: string; target: number; current: number } | null;
  theme_pref?: string;
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
  due_time?: string;
  recurrence?: 'none' | 'daily' | 'weekly';
  reminder_minutes?: number;
  submitted_at?: string;
  approved_at?: string;
  completed_at?: string;
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

export type ActiveTab = 'quest' | 'shop' | 'social' | 'stats' | 'settings' | 'tutorial' | 'admin';
export type ParentSubTab = 'pendentes' | 'gerenciar' | 'loja';

// ---------------------------------------------------------------------------
// v2 domain types
// ---------------------------------------------------------------------------
export type PlanInterval = 'month' | 'year' | 'once';
export type FamilyPlan = 'free' | 'premium';
export type ThemeVariant = 'light' | 'dark';

export interface Admin {
  user_id: string;
  created_at?: string;
}

export interface FamilySettings {
  family_id: string;
  plan: FamilyPlan;
  plan_provider?: PaymentProvider | null;
  plan_interval?: PlanInterval | null;
  subscription_id?: string | null;
  plan_expires_at?: string | null;
  theme: string;
  theme_variant: ThemeVariant;
  background_key?: string;
  schedule_enabled: boolean;
  location_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  interval: PlanInterval;
  limits: Record<string, unknown>;
  is_active: boolean;
  created_at?: string;
}

export type PaymentProvider = 'stripe' | 'mercadopago';

export interface PaymentSettings {
  provider: PaymentProvider;
  public_key?: string;
  secret_key?: string;
  webhook_secret?: string;
  updated_by?: string;
  updated_at?: string;
}

export type TicketStatus = 'open' | 'in_progress' | 'done' | 'answered';

export interface SupportTicket {
  id: string;
  family_id: string;
  author_profile_id: string;
  message: string;
  status: TicketStatus;
  admin_reply?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileLocation {
  profile_id: string;
  family_id: string;
  lat?: number;
  lng?: number;
  updated_at?: string;
}

