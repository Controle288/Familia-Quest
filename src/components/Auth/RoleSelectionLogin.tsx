// Tela unificada de Login/Cadastro do FamilyQuest.
// Logo oficial centralizada, abas Entrar/Criar Conta e seleção de perfil
// (Responsáveis vs Filhos). O fluxo de Filhos revela o código de convite e
// a escolha de gênero (menino/menina). Componente controlado por props: quem
// usa (AuthOnboarding) fornece a lógica de autenticação.

import React, { useEffect, useState } from 'react';
import { User, Shield, KeyRound, ArrowRight } from 'lucide-react';

export type MainRole = 'responsavel' | 'filho';
export type AuthMode = 'entrar' | 'cadastrar';
export type ChildGender = 'menino' | 'menina';

export interface RoleSelectionLoginProps {
  loading?: boolean;
  onEntrar: (data: { email: string; password: string }) => void;
  onCadastrar: (data: {
    familyName: string;
    respName: string;
    email: string;
    password: string;
  }) => void;
  onConvite: (data: {
    email: string;
    password: string;
    code: string;
    gender: ChildGender;
    age: number;
  }) => void;
  // Responsável entrando em família existente via código de convite.
  onJoinConvite?: (data: { email: string; password: string; code: string }) => void;
  onEsqueciSenha?: () => void;
}

// Senha forte: mínimo 8 caracteres, com pelo menos uma letra e um número.
const isStrong = (pw: string) => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(pw);

const RoleSelectionLogin: React.FC<RoleSelectionLoginProps> = ({
  loading = false,
  onEntrar,
  onCadastrar,
  onConvite,
  onJoinConvite,
  onEsqueciSenha,
}) => {
  // Deep link de convite: ?invite=CODIGO preenche o código automaticamente
  // e direciona o usuário para o fluxo de cadastro (entrar em família existente).
  const prefillInvite =
    new URLSearchParams(window.location.search).get('invite')?.trim().toUpperCase() ?? '';

  const [authMode, setAuthMode] = useState<AuthMode>(prefillInvite ? 'cadastrar' : 'entrar');
  const [selectedRole, setSelectedRole] = useState<MainRole>(prefillInvite ? 'filho' : 'responsavel');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [respName, setRespName] = useState('');
  const [inviteCode, setInviteCode] = useState(prefillInvite);
  const [gender, setGender] = useState<ChildGender>('menino');
  const [age, setAge] = useState('');

  const isChild = selectedRole === 'filho';

  // Trava o fundo global (body) na cor escura sólida enquanto a tela de
  // autenticação está montada, impedindo o "flash" branco no overscroll.
  useEffect(() => {
    document.body.classList.add('fq-auth-bg');
    return () => document.body.classList.remove('fq-auth-bg');
  }, []);

  // Limpa o parâmetro da URL após capturá-lo, para que futuros reloads não
  // re-disparêm o deep link.
  useEffect(() => {
    if (prefillInvite) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [prefillInvite]);

  const handleSubmit = () => {
    if (isChild) {
      onConvite({ email, password, code: inviteCode, gender, age: age.trim() ? Number(age) : 0 });
    } else if (authMode === 'entrar') {
      onEntrar({ email, password });
    } else if (inviteCode.trim()) {
      onJoinConvite?.({ email, password, code: inviteCode.trim().toUpperCase() });
    } else {
      onCadastrar({ familyName, respName, email, password });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans overflow-y-auto overscroll-none">
      <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
        
        {/* LOGO OFICIAL */}
        <div className="text-center mb-4">
          <img
            src="/logo.png"
            alt="FamilyQuest Logo"
            className="h-28 w-auto mx-auto drop-shadow-[0_0_25px_rgba(59,130,246,0.6)] mb-3 transition-all duration-300 hover:scale-105"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/icon.svg';
            }}
          />
          <p className="text-xs text-slate-400">
            Transforme a rotina em uma aventura épica para toda a família.
          </p>
        </div>

        {/* ABAS: ENTRAR / CRIAR CONTA */}
        <div className="grid grid-cols-2 bg-slate-800/80 p-1 rounded-2xl mb-5 border border-slate-700/60">
          <button
            type="button"
            onClick={() => setAuthMode('entrar')}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              authMode === 'entrar'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('cadastrar')}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              authMode === 'cadastrar'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* SELEÇÃO DE PERFIL (RESPONSÁVEIS VS FILHOS) */}
        <div className="mb-5">
          <span className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 text-center mb-2">
            Você entra como:
          </span>
          <div className="grid grid-cols-2 gap-3">
            {/* CARD RESPONSÁVEIS */}
            <button
              type="button"
              onClick={() => setSelectedRole('responsavel')}
              className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all ${
                selectedRole === 'responsavel'
                  ? 'border-pink-500 bg-pink-950/25 shadow-[0_0_15px_rgba(236,72,153,0.3)] scale-[1.01]'
                  : 'border-slate-800 bg-slate-800/40 hover:border-pink-500/40'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-xl">👩‍🦰</span>
                <span className="text-xl">👨</span>
              </div>
              <span className="text-xs font-black tracking-wide text-slate-100 uppercase">
                Responsáveis
              </span>
            </button>

            {/* CARD FILHOS */}
            <button
              type="button"
              onClick={() => setSelectedRole('filho')}
              className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all ${
                selectedRole === 'filho'
                  ? 'border-cyan-400 bg-cyan-950/25 shadow-[0_0_15px_rgba(34,211,238,0.3)] scale-[1.01]'
                  : 'border-slate-800 bg-slate-800/40 hover:border-cyan-400/40'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-xl">👧</span>
                <span className="text-xl">👦</span>
              </div>
              <span className="text-xs font-black tracking-wide text-slate-100 uppercase">
                Filhos
              </span>
            </button>
          </div>
        </div>

        {/* CAMPOS DO FORMULÁRIO */}
        <div className="space-y-3 mb-5">
          {/* Campos de cadastro (somente responsável): criar família OU entrar via código */}
          {authMode === 'cadastrar' && !isChild && (
            <div className="space-y-3 animate-fadeIn">
              {/* Nome da família: visível quando NÃO há código (criando nova família) */}
              {!inviteCode.trim() && (
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Nome da família (ex: Família Silva)"
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl py-3 px-4 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition"
                />
              )}

              <input
                type="text"
                value={respName}
                onChange={(e) => setRespName(e.target.value)}
                placeholder="Seu nome (Responsável)"
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl py-3 px-4 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition"
              />

              {/* Código de convite: visível quando NÃO há nome de família (entrando em existente) */}
              {!familyName.trim() && (
                <div className="relative">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Código de convite (para entrar em família existente)"
                    className="w-full bg-slate-800/90 border border-pink-500/70 rounded-2xl py-3 px-4 pl-10 text-xs text-slate-100 focus:outline-none focus:border-pink-400 transition"
                  />
                  <KeyRound className="w-4 h-4 text-pink-400 absolute left-3.5 top-3.5" />
                </div>
              )}
            </div>
          )}

          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail de acesso"
              className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl py-3 px-4 pl-10 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition"
            />
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>

          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl py-3 px-4 pl-10 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition"
            />
            <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>

          {/* Dica de senha forte (modo cadastro de responsável) */}
          {authMode === 'cadastrar' && !isChild && (
            <p className={`text-[10px] ${isStrong(password) ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isStrong(password)
                ? 'Senha forte ✓'
                : 'Senha fraca: use ao menos 8 caracteres, com letras e números.'}
            </p>
          )}

          {/* FLUXO FILHO: código de convite + escolha de gênero */}
          {isChild && (
            <div className="space-y-3 animate-fadeIn">
              <div className="relative">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Código de convite da família"
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl py-3 px-4 pl-10 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition"
                />
                <KeyRound className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
              </div>

              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={17}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Idade (anos)"
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl py-3 px-4 pl-10 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition"
                />
                <User className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
              </div>

              <div>
                <span className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">
                  Você é:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender('menino')}
                    className={`py-2 rounded-xl text-xs font-bold border-2 transition ${
                      gender === 'menino'
                        ? 'border-cyan-400 bg-cyan-950/30 text-white'
                        : 'border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    👦 Menino
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('menina')}
                    className={`py-2 rounded-xl text-xs font-bold border-2 transition ${
                      gender === 'menina'
                        ? 'border-pink-400 bg-pink-950/30 text-white'
                        : 'border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    👧 Menina
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTÃO DE AÇÃO PRINCIPAL */}
        <button
          type="button"
          disabled={loading}
          onClick={handleSubmit}
          className="w-full py-3 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-950/50 transition cursor-pointer mb-3 disabled:opacity-60"
        >
          <span>
            {isChild
              ? 'Entrar com Convite'
              : authMode === 'entrar'
              ? 'Entrar no Sistema'
              : inviteCode.trim()
              ? 'Entrar na Família'
              : 'Concluir Cadastro'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* ESQUECI A SENHA (somente responsável no login) */}
        {!isChild && authMode === 'entrar' && onEsqueciSenha && (
          <button
            type="button"
            onClick={onEsqueciSenha}
            className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-200"
          >
            Esqueci a senha
          </button>
        )}
      </div>
    </div>
  );
};

export default RoleSelectionLogin;
