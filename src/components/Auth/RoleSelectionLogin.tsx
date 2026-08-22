// Componente de seleção de perfil (Responsáveis / Filhos) com subseleção.
// Renderiza um bloco escuro/roxo para ser embutido dentro do modal de login/cadastro.

import React from 'react';
import { KeyRound } from 'lucide-react';

export type MainRole = 'responsavel' | 'filho' | null;
export type SubRoleParent = 'mae' | 'pai' | 'outro' | null;

export interface ChildOption {
  id: string;
  name: string;
  avatar: string; // emoji ou URL
  gender: 'menino' | 'menina';
}

export interface RoleSelectionValue {
  main: MainRole;
  parent: SubRoleParent;
  childId: string | null;
}

interface RoleSelectionLoginProps {
  value: RoleSelectionValue;
  onChange: (next: RoleSelectionValue) => void;
  // Perfis de filhos disponíveis na família (usado na subseleção)
  childrenProfiles?: ChildOption[];
  // Desabilita o card de Filhos (ex.: tela de criação, onde só há responsável)
  disableChildren?: boolean;
}

const PARENT_OPTIONS = [
  { id: 'mae', label: 'Mãe', emoji: '👩' },
  { id: 'pai', label: 'Pai', emoji: '👨' },
  { id: 'outro', label: 'Outro', emoji: '🧑' },
] as const;

const RoleSelectionLogin: React.FC<RoleSelectionLoginProps> = ({
  value,
  onChange,
  childrenProfiles = [],
  disableChildren = false,
}) => {
  const handleSelectMain = (main: Exclude<MainRole, null>) => {
    if (main === 'responsavel') {
      onChange({ main, parent: value.parent ?? 'mae', childId: null });
    } else {
      onChange({ main, parent: null, childId: value.childId });
    }
  };

  return (
    <div className="rounded-3xl bg-slate-950 border border-slate-800 p-5 shadow-xl">
      {/* Título da seção */}
      <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
        Você entra como:
      </p>

      {/* 2 CARDS PRINCIPAIS */}
      <div className="grid grid-cols-2 gap-4">
        {/* CARD 1: RESPONSÁVEIS */}
        <button
          type="button"
          onClick={() => handleSelectMain('responsavel')}
          className={`relative flex flex-col items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${
            value.main === 'responsavel'
              ? 'border-pink-500 bg-pink-950/20 shadow-[0_0_20px_rgba(236,72,153,0.35)] scale-[1.02]'
              : 'border-slate-800 bg-slate-800/40 hover:border-pink-500/50 hover:bg-slate-800/70'
          }`}
        >
          {/* Avatares ilustrados (Mãe e Pai) */}
          <div className="flex items-center justify-center gap-2 my-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 p-0.5 flex items-center justify-center text-2xl shadow-md">
              👩‍🦰
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 p-0.5 flex items-center justify-center text-2xl shadow-md">
              👨
            </div>
          </div>
          <div className="text-center mt-2">
            <span className="block text-sm font-extrabold tracking-wider text-slate-100 uppercase">
              Responsáveis
            </span>
            <span className="text-[11px] text-pink-400/90 font-medium">Mãe / Pai / Outro</span>
          </div>
        </button>

        {/* CARD 2: FILHOS */}
        <button
          type="button"
          disabled={disableChildren}
          onClick={() => handleSelectMain('filho')}
          className={`relative flex flex-col items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${
            value.main === 'filho'
              ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(34,211,238,0.35)] scale-[1.02]'
              : 'border-slate-800 bg-slate-800/40 hover:border-cyan-400/50 hover:bg-slate-800/70'
          } ${disableChildren ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {/* Avatares ilustrados (Menina e Menino) */}
          <div className="flex items-center justify-center gap-2 my-2 relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-400 to-rose-400 p-0.5 flex items-center justify-center text-2xl shadow-md">
              👧
            </div>
            <div className="w-0.5 h-8 bg-slate-700/60 rounded-full mx-0.5" />
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 to-teal-400 p-0.5 flex items-center justify-center text-2xl shadow-md">
              👦
            </div>
          </div>
          <div className="text-center mt-2">
            <span className="block text-sm font-extrabold tracking-wider text-slate-100 uppercase">
              Filhos
            </span>
            <span className="text-[11px] text-cyan-400/90 font-medium">Acesso das crianças</span>
          </div>
        </button>
      </div>

      {/* SUBSELEÇÃO: RESPONSÁVEL */}
      {value.main === 'responsavel' && (
        <div className="mt-4 bg-slate-800/60 border border-pink-500/30 rounded-2xl p-4 animate-fadeIn">
          <span className="block text-xs font-semibold text-slate-300 mb-3 text-center">
            Selecione o perfil do responsável:
          </span>
          <div className="grid grid-cols-3 gap-2">
            {PARENT_OPTIONS.map((parent) => (
              <button
                key={parent.id}
                type="button"
                onClick={() => onChange({ ...value, main: 'responsavel', parent: parent.id })}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition ${
                  value.parent === parent.id
                    ? 'bg-pink-600 border-pink-400 text-white shadow-lg'
                    : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-pink-500/50'
                }`}
              >
                <span className="text-xl mb-1">{parent.emoji}</span>
                {parent.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SUBSELEÇÃO: FILHOS */}
      {value.main === 'filho' && !disableChildren && (
        <div className="mt-4 bg-slate-800/60 border border-cyan-500/30 rounded-2xl p-4 animate-fadeIn">
          <span className="block text-xs font-semibold text-slate-300 mb-3 text-center">
            Quem está entrando?
          </span>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {childrenProfiles.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => onChange({ ...value, main: 'filho', childId: child.id })}
                className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold transition ${
                  value.childId === child.id
                    ? 'bg-cyan-600 border-cyan-300 text-white shadow-lg'
                    : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-cyan-400/50'
                }`}
              >
                <span className="text-2xl">{child.avatar}</span>
                <div className="text-left">
                  <span className="block font-bold">{child.name}</span>
                  <span className="text-[10px] opacity-80 uppercase">Perfil Criança</span>
                </div>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-700/50 text-[11px] text-cyan-300/80">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Crianças entram com o código de convite familiar</span>
          </div>
        </div>
      )}

      {/* Aviso quando Filhos está desabilitado (ex.: tela de criação) */}
      {value.main === 'filho' && disableChildren && (
        <div className="mt-4 bg-slate-800/60 border border-cyan-500/30 rounded-2xl p-4 text-center text-[11px] text-cyan-300/80 animate-fadeIn">
          As crianças entram com o código de convite que você receberá ao criar a família.
        </div>
      )}
    </div>
  );
};

export default RoleSelectionLogin;
