import React, { useState } from 'react';
import { X, Sparkles, DollarSign, Image as ImageIcon, Check } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { RewardCategory } from '../types';

interface CreateRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRewardModal: React.FC<CreateRewardModalProps> = ({ isOpen, onClose }) => {
  const { createReward } = useFamily();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsCost, setPointsCost] = useState(300);
  const [moneyCost, setMoneyCost] = useState(0);
  const [category, setCategory] = useState<RewardCategory>('entertainment');
  const [imageUrl, setImageUrl] = useState(
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAaZIHFQS37oiPujwTQMUSHspf_yIsrpKYyPFlWMR__9xJtI4mmH85_WNDpvDU51LQ0DZ-idh0RQzmMwPisBspDe0pjXHR1nMPneDLGIuNSLAkIdymtlWunp3cpNGZ1bEz-sinX-OZkqS5PpxFIjq1KBb0NssIk-HcjH7nekUsh4ico8nbzkObyXxHMPuNRLv6JEApSeVPr_46g1F5uHYyIVgqDzbbeQy_vy9vW3cAYFZQJBfn1A805'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const presetImages = [
    {
      label: 'Sorvete',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaZIHFQS37oiPujwTQMUSHspf_yIsrpKYyPFlWMR__9xJtI4mmH85_WNDpvDU51LQ0DZ-idh0RQzmMwPisBspDe0pjXHR1nMPneDLGIuNSLAkIdymtlWunp3cpNGZ1bEz-sinX-OZkqS5PpxFIjq1KBb0NssIk-HcjH7nekUsh4ico8nbzkObyXxHMPuNRLv6JEApSeVPr_46g1F5uHYyIVgqDzbbeQy_vy9vW3cAYFZQJBfn1A805',
    },
    {
      label: 'Videogame',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMCl48S4QAHGs8QdBNO2GFxi0ZeVz-MQotIKjNC5tHtoORmFWpNu_aObN5MpXr2UAa7q5iTZiWbmecAqPEx6Gkegc032pjfJ7iARSrywQtj_QQacUFq3IFgPJPrZtMiFtI9s_lmx8-G2azo0ymz7iImqYu6jp8koE63b1LqFd8nhPCtWyQl3suwFfHEuttEFr1eX6vvtfdnCt03QYF6uUb9QmTW2rpvIXdfpdO1EcuUYsUegqEg1h7',
    },
    {
      label: 'Cinema',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBoCxoVEp0ky3lk3JAVncvv949Axq78awGUBYKRvYRWtAvhYUVCUP9KSENs7MSq7jp0vF_LmQhMNn-4hWpgnNnZOspwUt9gNJiSdM8LQE7e5bcNljRIQNWXNvwOuUPciQ69zrMiy1M6eCEUIspjBUjAqWWIS6A9VjhsvRLHUqbyl8U2MomjA__yKMpC3L1LUFCRAXhUnnWFetcI7Ey1WjJ3Bv5DZ9s56KBKjCBVeo-ywJZYPaPqiK9h',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await createReward({
        title: title.trim(),
        description: description.trim(),
        points_cost: Number(pointsCost) || 300,
        money_cost: Number(moneyCost) || 0,
        category,
        image_url: imageUrl,
        is_available: true,
      });
      onClose();
      setTitle('');
      setDescription('');
      setPointsCost(300);
      setMoneyCost(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-heading font-bold text-xl text-slate-900">
              Novo Prêmio para a Loja
            </h3>
            <p className="text-xs text-slate-500">
              Cadastre recompensas para resgate com pontos.
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
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Título do Prêmio *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Passeio no Parque de Trampolim"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#3525cd]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Custo em Pontos (XP) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="50"
                  max="10000"
                  step="50"
                  value={pointsCost}
                  onChange={(e) => setPointsCost(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-[#006e4b]"
                />
                <Sparkles className="w-4 h-4 text-emerald-600 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Custo em R$ (opcional)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="0.5"
                  value={moneyCost}
                  onChange={(e) => setMoneyCost(Number(e.target.value))}
                  placeholder="0,00"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-[#005338]"
                />
                <DollarSign className="w-4 h-4 text-emerald-600 absolute left-2.5 top-3" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Imagem Ilustrativa
            </label>
            <div className="flex gap-2 mb-2">
              {presetImages.map((img) => (
                <button
                  type="button"
                  key={img.label}
                  onClick={() => setImageUrl(img.url)}
                  className={`w-16 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                    imageUrl === img.url
                      ? 'border-[#3525cd] scale-105 shadow-xs ring-2 ring-indigo-100'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Ou insira a URL da imagem"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre como o prêmio será entregue..."
              rows={2}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#3525cd]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-full bg-[#3525cd] text-white font-heading font-bold text-sm hover:bg-[#2e1fb5] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Salvando...' : 'Adicionar à Loja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
