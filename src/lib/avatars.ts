const PARENT_AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=FQ-Guardiao-1',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=FQ-Guardiao-2',
];

const CHILD_AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=FQ-Aventureiro-1',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=FQ-Aventureiro-2',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=FQ-Aventureiro-3',
];

/** Default avatar URL for a freshly created profile, by role. */
export function defaultAvatar(role: 'parent' | 'child', index = 0): string {
  const list = role === 'parent' ? PARENT_AVATARS : CHILD_AVATARS;
  return list[index % list.length];
}

export type RelationshipType = 'mae' | 'pai' | 'avo' | 'outro' | 'filho';

export interface RelationshipMeta {
  /** Rótulo amigável exibido no app. */
  label: string;
  /** Emoji representando a relação. */
  emoji: string;
  /** Cor de destaque (anel, chip, fundo). */
  color: string;
  /** Cor de texto compatível com a cor de destaque. */
  textColor: string;
  /** Seed do avatar DiceBear para gerar um boneco distinto. */
  seed: string;
  /** Título/patente padrão do perfil. */
  title: string;
  /** Papel de permissão associado. */
  role: 'parent' | 'child';
}

/** Metadados de cada relação familiar, com boneco, cor e emoji próprios. */
export const RELATIONSHIP_META: Record<RelationshipType, RelationshipMeta> = {
  mae: {
    label: 'Mãe',
    emoji: '👩',
    color: '#ec4899',
    textColor: '#ffffff',
    seed: 'FQ-Mae',
    title: 'Mãe Guardiã',
    role: 'parent',
  },
  pai: {
    label: 'Pai',
    emoji: '👨',
    color: '#3b82f6',
    textColor: '#ffffff',
    seed: 'FQ-Pai',
    title: 'Pai Guardião',
    role: 'parent',
  },
  avo: {
    label: 'Avós',
    emoji: '👵',
    color: '#8b5cf6',
    textColor: '#ffffff',
    seed: 'FQ-Avo',
    title: 'Avô(ó) Guardião(ã)',
    role: 'parent',
  },
  outro: {
    label: 'Outro responsável',
    emoji: '🧑',
    color: '#10b981',
    textColor: '#ffffff',
    seed: 'FQ-Outro',
    title: 'Responsável',
    role: 'parent',
  },
  filho: {
    label: 'Filho(a)',
    emoji: '👦',
    color: '#f59e0b',
    textColor: '#ffffff',
    seed: 'FQ-Aventureiro',
    title: 'Aventureiro',
    role: 'child',
  },
};

/** Lista de relações de responsável (para o criador da família). */
export const GUARDIAN_RELATIONSHIPS: RelationshipType[] = ['mae', 'pai', 'outro'];

/** Lista completa de relações oferecidas ao entrar com código. */
export const ALL_RELATIONSHIPS: RelationshipType[] = ['pai', 'mae', 'avo', 'outro', 'filho'];

/** Rótulo amigável de uma relação (fallback: Responsável/Filho). */
export function relationshipLabel(rel?: RelationshipType | null): string {
  if (!rel) return '';
  return RELATIONSHIP_META[rel].label;
}

/** Gera a URL do boneco DiceBear para uma relação familiar. */
export function avatarForRelationship(rel: RelationshipType, index = 0): string {
  const meta = RELATIONSHIP_META[rel];
  const suffix = index > 0 ? `-${index + 1}` : '';
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${meta.seed}${suffix}`;
}
