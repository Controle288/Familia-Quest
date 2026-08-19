import React from 'react';
import {
  Sparkles,
  Bed,
  BookOpen,
  Dog,
  Utensils,
  Brush,
  Trash2,
  Smile,
  Heart,
  Gamepad2,
  GraduationCap,
  Shirt,
  ShoppingBag,
  LucideIcon
} from 'lucide-react';

interface TaskIconProps {
  name: string;
  className?: string;
}

export const TaskIcon: React.FC<TaskIconProps> = ({ name, className = 'w-6 h-6' }) => {
  const iconMap: Record<string, LucideIcon> = {
    cleaning_services: Brush,
    bed: Bed,
    menu_book: BookOpen,
    pets: Dog,
    local_dining: Utensils,
    trash: Trash2,
    sparkles: Sparkles,
    study: GraduationCap,
    clothes: Shirt,
    game: Gamepad2,
    shopping: ShoppingBag,
    heart: Heart,
    smile: Smile,
  };

  const IconComponent = iconMap[name] || Sparkles;
  return <IconComponent className={className} />;
};
