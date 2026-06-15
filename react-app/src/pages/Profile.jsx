import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import BentoCard from '../components/BentoCard';
import { User, Save, Users, Calendar, Mail, Image, Link2, Key, Briefcase, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import UserAvatar from '../components/UserAvatar';
import { listenTeams } from '../services/firestore';

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

const Profile = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [teamId, setTeamId] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [associatedTeams, setAssociatedTeams] = useState([]);
  const [jiraUrl, setJiraUrl] = useState('');
  const [jiraToken, setJiraToken] = useState('');
  const [tdnUrl, setTdnUrl] = useState('');
  const [tdnToken, setTdnToken] = useState('');
  const [themePrimary, setThemePrimary] = useState('#6366f1');
  const [themeSecondary, setThemeSecondary] = useState('#a855f7');
  const [teams, setTeams] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const unsub = listenTeams(setTeams);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
      setTeamId(user.teamId || '');
      setJobRole(user.jobRole || '');
      setAssociatedTeams(user.associatedTeams || []);
      setJiraUrl(user.jiraUrl || '');
      setJiraToken(user.jiraToken || '');
      setTdnUrl(user.tdnUrl || '');
      setTdnToken(user.tdnToken || '');
      setThemePrimary(user.themePrimary || '#6366f1');
      setThemeSecondary(user.themeSecondary || '#a855f7');
    }
  }, [user]);

  const handleToggleTeam = (teamIdVal) => {
    setAssociatedTeams((prev) => {
      const isAlreadySelected = prev.includes(teamIdVal);
      let next;
      if (isAlreadySelected) {
        next = prev.filter((id) => id !== teamIdVal);
      } else {
        next = [...prev, teamIdVal];
      }

      // Se remover o time principal ativo, redefinir para outro ou vazio
      if (isAlreadySelected && teamId === teamIdVal) {
        setTeamId(next[0] || '');
      } else if (!isAlreadySelected && next.length === 1) {
        setTeamId(teamIdVal);
      }

      return next;
    });
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!displayName) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName,
        photoURL,
        teamId,
        jobRole,
        associatedTeams,
        jiraUrl,
        jiraToken,
        tdnUrl,
        tdnToken,
        themePrimary,
        themeSecondary
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setSaveError('Falha ao salvar dados de perfil no Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    if (dateVal.seconds) {
      return new Date(dateVal.seconds * 1000).toLocaleDateString('pt-BR');
    }
    const date = new Date(dateVal);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-8">
      
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Configurações de Perfil</h1>
        <p className="text-sm text-slate-400">Gerencie suas informações pessoais, squad de atuação e estilo do portal.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUNA ESQUERDA: PERFIL & CONEXÕES */}
        <div className="space-y-8">
          <BentoCard title="Meu Perfil" subtitle="Edição cadastral" icon={User}>
        
        {/* Foto e Status */}
        <div className="flex items-center gap-5 mb-8">
          <UserAvatar photoURL={photoURL} displayName={displayName} sizeClass="h-16 w-16" textClass="text-xl font-bold" />
          <div>
            <h4 className="font-bold text-white text-base">{displayName || 'Membro do Time'}</h4>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {jobRole || 'CARGO NÃO DEFINIDO'}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Squad Ativo: {teamId ? teamId.toUpperCase() : 'NÃO DEFINIDO'}
              </span>
            </div>
          </div>
        </div>

        {saveSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            Perfil atualizado com sucesso!
          </div>
        )}

        {saveError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            {saveError}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Nome de Exibição
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome"
                className="premium-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 text-indigo-400" />
                <span>Cargo / Papel</span>
              </label>
              <select
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className="premium-input bg-slate-950"
              >
                <option value="">-- Selecione seu cargo --</option>
                {CARGOS.map((cargo) => (
                  <option key={cargo} value={cargo}>{cargo}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ASSOCIAÇÃO MULTI-TIME */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              <span>Times / Squads Associados</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/40 border border-slate-900 rounded-xl max-h-36 overflow-y-auto">
              {teams.map((t) => {
                const isChecked = associatedTeams.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleToggleTeam(t.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all ${
                      isChecked
                        ? 'bg-indigo-600/10 border-indigo-500/40 text-white'
                        : 'bg-transparent border-slate-900 text-slate-400 hover:border-slate-800'
                    }`}
                  >
                    <div className={`h-4 w-4 rounded flex items-center justify-center border transition-all ${
                      isChecked ? 'bg-indigo-600 border-indigo-500' : 'border-slate-800 bg-slate-900'
                    }`}>
                      {isChecked && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <span className="truncate">{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SELECIONAR SQUAD ATIVO */}
          {associatedTeams.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Squad Principal (Ativo)
              </label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="premium-input bg-slate-950"
              >
                {associatedTeams.map((teamIdVal) => {
                  const teamObj = teams.find((t) => t.id === teamIdVal);
                  return (
                    <option key={teamIdVal} value={teamIdVal}>
                      {teamObj ? teamObj.name : teamIdVal}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Image className="h-3.5 w-3.5" />
              <span>URL da Foto de Perfil (Avatar)</span>
            </label>
            <input
              type="text"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://exemplo.com/foto.jpg"
              className="premium-input"
            />
          </div>

          {/* Dados Informativos Somente Leitura */}
          <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-indigo-400" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Endereço de E-mail</p>
                <p className="text-xs font-medium text-slate-300">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-indigo-400" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Data de Criação</p>
                <p className="text-xs font-medium text-slate-300">{formatDate(user?.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary py-2.5 text-xs flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>

          </BentoCard>
 
          <BentoCard title="Conexões de APIs" subtitle="Integração Jira &amp; TDN" icon={Link2}>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Configuração Jira</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">URL Base do Jira</label>
                <input
                  type="text"
                  value={jiraUrl}
                  onChange={(e) => setJiraUrl(e.target.value)}
                  placeholder="https://jira.empresa.com"
                  className="premium-input text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                  <Key className="h-3 w-3" />
                  <span>Token de Acesso / Senha</span>
                </label>
                <input
                  type="password"
                  value={jiraToken}
                  onChange={(e) => setJiraToken(e.target.value)}
                  placeholder="Seu token de acesso"
                  className="premium-input text-xs bg-slate-950/60"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Configuração TDN (Confluence)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">URL Base do TDN</label>
                <input
                  type="text"
                  value={tdnUrl}
                  onChange={(e) => setTdnUrl(e.target.value)}
                  placeholder="https://tdn.empresa.com"
                  className="premium-input text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                  <Key className="h-3 w-3" />
                  <span>Token de Acesso</span>
                </label>
                <input
                  type="password"
                  value={tdnToken}
                  onChange={(e) => setTdnToken(e.target.value)}
                  placeholder="Seu token do TDN"
                  className="premium-input text-xs bg-slate-950/60"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-800/40">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary py-2.5 text-xs flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Salvar Conexões</span>
                </>
              )}
            </button>
          </div>
        </form>
          </BentoCard>
        </div>
 
        {/* COLUNA DIREITA: TEMAS & APARÊNCIA */}
        <div className="space-y-8">
          <BentoCard title="Aparência &amp; Temas Neon" subtitle="Escolha as cores primárias do sistema" icon={Image}>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Presets Premium</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { name: 'Cyberpunk Indigo', primary: '#6366f1', secondary: '#a855f7', desc: 'Indigo & Roxo clássico' },
                  { name: 'Emerald Matrix', primary: '#10b981', secondary: '#06b6d4', desc: 'Verde Matrix & Ciano' },
                  { name: 'Crimson Lava', primary: '#ef4444', secondary: '#f97316', desc: 'Vermelho & Laranja vulcânico' },
                  { name: 'Neon Cyan', primary: '#06b6d4', secondary: '#3b82f6', desc: 'Ciano & Azul cyber' },
                  { name: 'Golden Sun', primary: '#f59e0b', secondary: '#e11d48', desc: 'Ambar & Rosa crepúsculo' }
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setThemePrimary(preset.primary);
                      setThemeSecondary(preset.secondary);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      themePrimary === preset.primary && themeSecondary === preset.secondary
                        ? 'bg-slate-900 border-indigo-500/80 shadow-[0_0_10px_rgba(99,102,241,0.15)] text-white'
                        : 'bg-slate-950/20 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex gap-1">
                      <span className="h-4 w-4 rounded-full border border-slate-800" style={{ backgroundColor: preset.primary }} />
                      <span className="h-4 w-4 rounded-full border border-slate-800 -ml-2" style={{ backgroundColor: preset.secondary }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold">{preset.name}</p>
                      <p className="text-[10px] text-slate-500">{preset.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5 bg-slate-950/40 p-4 border border-slate-900 rounded-xl">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Customização de Cores</label>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">Cor Primária</p>
                    <p className="text-[10px] text-slate-500">Glow de botões e links ativos</p>
                  </div>
                  <input
                    type="color"
                    value={themePrimary}
                    onChange={(e) => setThemePrimary(e.target.value)}
                    className="h-10 w-16 bg-transparent border border-slate-800 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">Cor Secundária</p>
                    <p className="text-[10px] text-slate-500">Gradientes e decorações secundárias</p>
                  </div>
                  <input
                    type="color"
                    value={themeSecondary}
                    onChange={(e) => setThemeSecondary(e.target.value)}
                    className="h-10 w-16 bg-transparent border border-slate-800 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-center gap-3 relative overflow-hidden"
                   style={{ borderColor: `${themePrimary}30` }}>
                <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
                     style={{ backgroundImage: `linear-gradient(to bottom right, ${themePrimary}, ${themeSecondary})` }} />
                <button
                  type="button"
                  className="font-semibold text-xs rounded-xl px-4 py-2 text-white transition-all pointer-events-none"
                  style={{ 
                    backgroundColor: themePrimary, 
                    boxShadow: `0 4px 15px ${themePrimary}40`
                  }}
                >
                  Botão Destaque
                </button>
                <span className="text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded"
                      style={{ 
                        color: themeSecondary, 
                        borderColor: `${themeSecondary}30`,
                        backgroundColor: `${themeSecondary}10`
                      }}>
                  Badge Teste
                </span>
              </div>
            </div>
            
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-800/40">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary py-2.5 text-xs flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Salvar Tema</span>
                </>
              )}
            </button>
          </div>
        </form>
          </BentoCard>
        </div>
 
      </div>
 
    </div>
  );
};

export default Profile;
