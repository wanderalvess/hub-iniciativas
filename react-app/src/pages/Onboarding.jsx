import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { listenTeams, createTeam } from '../services/firestore';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Users, Plus, Check, LogOut, ArrowRight, ShieldAlert, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

const CARGOS = [
  'Agile Master',
  'Scrum Master',
  'Product Owner',
  'Tech Lead',
  'Developer',
  'QA',
  'Designer',
  'UX',
  'People Lead',
  'Subject Matter Expert (SME)'
];

const Onboarding = () => {
  const { user, logout } = useAuth();
  const [teams, setTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [principalTeamId, setPrincipalTeamId] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = listenTeams(setTeams);
    return () => unsub();
  }, []);

  const handleToggleTeam = (teamId) => {
    setSelectedTeams((prev) => {
      const isAlreadySelected = prev.includes(teamId);
      let next;
      if (isAlreadySelected) {
        next = prev.filter((id) => id !== teamId);
      } else {
        next = [...prev, teamId];
      }

      // Se remover o time principal, seleciona outro time disponível ou deixa vazio
      if (isAlreadySelected && principalTeamId === teamId) {
        setPrincipalTeamId(next[0] || '');
      } else if (!isAlreadySelected && next.length === 1) {
        setPrincipalTeamId(teamId);
      }

      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!jobRole) {
        throw new Error('Por favor, selecione seu cargo / papel.');
      }

      let finalSelectedTeams = [...selectedTeams];
      let finalPrincipalTeam = principalTeamId;

      if (isCreatingNew) {
        if (!newTeamName.trim()) {
          throw new Error('Por favor, informe o nome do time.');
        }
        // Cria o novo time no Firestore
        const created = await createTeam(newTeamName.trim());
        if (!finalSelectedTeams.includes(created.id)) {
          finalSelectedTeams.push(created.id);
        }
        if (!finalPrincipalTeam) {
          finalPrincipalTeam = created.id;
        }
      }

      // Atualiza o documento de perfil do usuário no Firestore com os dados completos
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        jobRole,
        associatedTeams: finalSelectedTeams,
        teamId: finalPrincipalTeam
      });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Falha ao salvar dados de onboarding. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-slate-950 px-4 py-8 overflow-y-auto">
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative my-auto"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>

        <div className="text-center mb-6">
          <span className="inline-block bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-2">
            Primeiro Acesso
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-1">
            Configure seu Perfil &amp; Squad
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            Olá, <strong className="text-white">{user?.displayName || 'Membro'}</strong>. Configure seu cargo e times associados para acessar o Hub de Iniciativas.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs"
          >
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* SELETOR DE CARGO */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-indigo-400" />
              <span>Qual seu Cargo / Papel?</span>
            </label>
            <div className="relative">
              <select
                required
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className="premium-input bg-slate-950 appearance-none text-xs"
              >
                <option value="">-- Escolha seu papel --</option>
                {CARGOS.map((cargo) => (
                  <option key={cargo} value={cargo}>
                    {cargo}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <ArrowRight className="h-3 w-3 rotate-90" />
              </div>
            </div>
          </div>

          {/* SELEÇÃO DE TIMES */}
          {!isCreatingNew ? (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Em qual(is) Squads / Times você atua?</span>
                </label>
                
                {/* Checkboxes de Times */}
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-950/40 border border-slate-800 rounded-xl">
                  {teams.length === 0 ? (
                    <p className="text-slate-500 text-xs col-span-2 text-center py-4">Nenhum time cadastrado.</p>
                  ) : (
                    teams.map((t) => {
                      const isSelected = selectedTeams.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleToggleTeam(t.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all ${
                            isSelected
                              ? 'bg-indigo-600/10 border-indigo-500/40 text-white'
                              : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-700/60'
                          }`}
                        >
                          <div className={`h-4 w-4 rounded flex items-center justify-center border transition-all ${
                            isSelected ? 'bg-indigo-600 border-indigo-500' : 'border-slate-700 bg-slate-900'
                          }`}>
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className="truncate">{t.name}</span>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Seu time não está na lista?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNew(true);
                    }}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-all"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Cadastrar Novo Time</span>
                  </button>
                </div>
              </div>

              {/* SELETOR DE TIME PRINCIPAL */}
              {selectedTeams.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Squad Principal / Ativo para Visualização
                  </label>
                  <select
                    value={principalTeamId}
                    onChange={(e) => setPrincipalTeamId(e.target.value)}
                    className="premium-input bg-slate-950 text-xs"
                  >
                    {selectedTeams.map((teamId) => {
                      const teamObj = teams.find((t) => t.id === teamId);
                      return (
                        <option key={teamId} value={teamId}>
                          {teamObj ? teamObj.name : teamId}
                        </option>
                      );
                    })}
                  </select>
                </motion.div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Nome do Novo Time / Squad
              </label>
              <input
                type="text"
                required
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Ex: Faturamento, Winnipeg, Squad Fiscal"
                className="premium-input text-xs"
              />

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Voltar para a lista?</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setNewTeamName('');
                  }}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-all"
                >
                  Ver lista de times
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-800/85">
            <button
              type="button"
              onClick={() => logout()}
              className="flex-1 btn-secondary py-2.5 text-xs flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair da Conta</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary py-2.5 text-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <span>Configurar</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Onboarding;
