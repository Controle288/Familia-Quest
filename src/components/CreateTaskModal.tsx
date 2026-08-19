import React, { useEffect, useState } from 'react';
import { X, Sparkles, DollarSign, Check, Brush, Bed, BookOpen, Dog, Utensils, Trash2, Heart } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { TaskCategory, RewardType } from '../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose }) => {
  const { profiles, createTask } = useFamily();

  const childrenProfiles = profiles.filter((p) => p.role === 'child');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState(childrenProfiles[0]?.id || '');
  const [category, setCategory] = useState<TaskCategory>('cleaning');
  const [iconName, setIconName] = useState('cleaning_services');
  const [rewardValue, setRewardValue] = useState(50);
  const [rewardMoney, setRewardMoney] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!childrenProfiles.length) {
      setAssignedTo('');
      return;
    }

    const hasValidSelection = childrenProfiles.some((child) => child.id === assignedTo);
    if (!hasValidSelection) {
      setAssignedTo(childrenProfiles[0].id);
    }
  }, [childrenProfiles, assignedTo]);

  if (!isOpen) return null;

  const iconOptions = [
    { name: 'cleaning_services', label: 'Limpeza', icon: Brush },
    { name: 'bed', label: 'Quarto', icon: Bed },
    { name: 'menu_book', label: 'Estudo', icon: BookOpen },
    { name: 'pets', label: 'Pets', icon: Dog },
    { name: 'local_dining', label: 'Cozinha', icon: Utensils },
    { name: 'trash', label: 'Lixo', icon: Trash2 },
    { name: 'heart', label: 'Cuidado', icon: Heart },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim(),
        assigned_to: assignedTo,
        category,
        icon_name: iconName,
        points: Number(rewardValue) || 50,
        reward_type: rewardMoney > 0 ? 'xp_and_money' : 'xp_only',
        reward_value: Number(rewardValue) || 50,
        reward_money: Number(rewardMoney) || 0,
      });
      onClose();
      // Reset
      setTitle('');
      setDescription('');
      setRewardValue(50);
      setRewardMoney(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-heading font-bold text-xl text-slate-900">
              Criar Nova Missão
            </h3>
            <p className="text-xs text-slate-500">
              Defina tarefas diárias e pontuações para seus filhos.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nome da Missão *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Organizar os brinquedos"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#3525cd]"
            />
          </div>

          {/* Child Assignment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Atribuir para *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {childrenProfiles.map((child) => (
                <button
                  type="button"
                  key={child.id}
                  onClick={() => setAssignedTo(child.id)}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                    assignedTo === child.id
                      ? 'border-[#3525cd] bg-indigo-50/70 text-[#3525cd] font-bold ring-1 ring-[#3525cd]'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <img
                    src={child.avatar_url}
                    alt={child.full_name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span className="text-xs">{child.full_name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Icon Choice */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ícone
            </label>
            <div className="flex gap-2 flex-wrap">
              {iconOptions.map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = iconName === opt.name;
                return (
                  <button
                    type="button"
                    key={opt.name}
                    onClick={() => {
                      setIconName(opt.name);
                      if (opt.name === 'pets') setCategory('pet');
                      else if (opt.name === 'menu_book') setCategory('study');
                      else if (opt.name === 'local_dining') setCategory('kitchen');
                      else setCategory('cleaning');
                    }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#3525cd] text-white shadow-sm ring-2 ring-indigo-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title={opt.label}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* XP and Money Rewards */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Recompensa XP
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  max="1000"
                  step="10"
                  value={rewardValue}
                  onChange={(e) => setRewardValue(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-[#6b38d4]"
                />
                <Sparkles className="w-4 h-4 text-violet-500 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Bônus Mesada (R$)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={rewardMoney}
                  onChange={(e) => setRewardMoney(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-emerald-700"
                />
                <DollarSign className="w-4 h-4 text-emerald-600 absolute left-2.5 top-3" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Instruções Opcionais
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instruções claras para a realização..."
              rows={2}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#3525cd]"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                data-testid="create-task-submit"
                className="w-full h-12 rounded-full bg-[#3525cd] text-white font-heading font-bold text-sm hover:bg-[#2e1fb5] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Criando Missão...' : 'Salvar e Publicar Missão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
