// Dados simulados para o FamiliaQuest

import { ThemeName } from "../components/Dashboard/DashboardThemes";

export type TaskStatus = 'pendente' | 'em_progresso' | 'concluida';

export interface FamiliaTask {
  id: string;
  name: string;
  points: number;
  xp?: number; // Para o modo Gamer
  monetaryValue?: number; // Para o modo Young Adult
  emoji: string;
  description: string;
  status: TaskStatus;
}

export interface FamiliaReward {
  id: string;
  name: string;
  cost: number; // Em pontos/estrelas
  monetaryCost?: number; // Em dinheiro (real ou virtual)
  emoji: string;
}

export interface FinancialGoal {
  name: string;
  target: number;
  current: number;
}

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  avatarUrl?: string;
  points: number;
  xp: number;
  level: number;
  balance: number; // Saldo monetário (modo Young Adult)
  streakDays: number;
  financialGoal: FinancialGoal | null;
  tasks: FamiliaTask[];
  availableRewards: FamiliaReward[];
}

export const mockChild: ChildProfile = {
  id: 'child123',
  name: 'Léo',
  age: 8, // Mude aqui para testar os dashboards (ex: 12 para Teen, 16 para Young Adult)
  // age: 12,
  // age: 16,
  avatarUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', // Avatar simples
  points: 20750,
  xp: 1550,
  level: 3,
  balance: 45.75, // Em R$
  streakDays: 5,
  financialGoal: {
    name: 'Economizar para o Celular',
    target: 800,
    current: 155,
  },
  tasks: [
    { id: 't1', name: 'Escovar Dentes', points: 10, emoji: '🪥', description: 'Manhã e Noite', status: 'concluida' },
    { id: 't2', name: 'Ler', points: 200, emoji: '📚', description: '[Check] 20 min', status: 'concluida' },
    { id: 't3', name: 'Arrumar Quarto', points: 150, emoji: '🧹', description: '[Pendente] Organizar brinquedos', status: 'pendente' },
    { id: 't4', name: 'Estudar Matemática', points: 300, xp: 50, emoji: '➗', description: 'Atividade online', status: 'em_progresso' },
    { id: 't5', name: 'Caminhar com o Cachorro', points: 100, monetaryValue: 2, emoji: '🐕', description: 'No final da tarde', status: 'pendente' },
  ],
  availableRewards: [
    { id: 'r1', name: 'Parque de Diversões', cost: 20000, emoji: '🎡' },
    { id: 'r2', name: 'Jogo Novo (Steam)', cost: 15000, monetaryCost: 120, emoji: '🎮' },
    { id: 'r3', name: 'Cinema com amigos', cost: 8000, monetaryCost: 40, emoji: '🎬' },
    { id: 'r4', name: 'Sorvete Grande', cost: 2500, emoji: '🍦' },
  ],
};
