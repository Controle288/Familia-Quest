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
