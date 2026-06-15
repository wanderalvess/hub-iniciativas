import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { listenTeamMembers, listenAuditLogs } from '../services/firestore';
import BentoCard from '../components/BentoCard';
import UserAvatar from '../components/UserAvatar';
import { useToast } from '../context/ToastContext';
import { Users, Link2, Copy, Check, Calendar, Activity, AlertTriangle, ShieldCheck, Mail, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

const getRoleBadgeClass = (role) => {
  const r = (role || '').toLowerCase();
  if (r.includes('people lead') || r.includes('pl')) {
    return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  }
  if (r.includes('agile master') || r.includes('scrum master') || r.includes('am') || r.includes('sm')) {
    return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
  }
  if (r.includes('tech lead') || r.includes('tl')) {
    return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
  }
  if (r.includes('developer') || r.includes('qa')) {
    return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400';
  }
  if (r.includes('designer') || r.includes('ux')) {
    return 'bg-pink-500/10 border-pink-500/30 text-pink-400';
  }
  if (r.includes('expert') || r.includes('sme')) {
    return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
  }
  return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
};

const Team = () => {
  const { user } = useAuth();
  const { inviteTeamId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // Se o usuário acessar com link de convite (/invite/:inviteTeamId)
  useEffect(() => {
    const processInvitation = async () => {
      if (inviteTeamId && user) {
        try {
          const teamRef = doc(db, 'teams', inviteTeamId);
          const teamSnap = await getDoc(teamRef);
          
          if (!teamSnap.exists()) {
            showToast('Time de convite não encontrado.', 'error');
            navigate('/team');
            return;
          }

          const teamData = teamSnap.data();
          const alreadyAssociated = user.associatedTeams?.includes(inviteTeamId);

          if (!alreadyAssociated) {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              associatedTeams: arrayUnion(inviteTeamId),
              teamId: inviteTeamId // Torna o time ativado por padrão
            });
            showToast(`Você foi associado com sucesso ao squad ${teamData.name}!`, 'success');
          } else {
            showToast(`Você já faz parte do squad ${teamData.name}.`, 'info');
          }
          
          navigate('/team');
        } catch (err) {
          console.error(err);
          showToast('Erro ao processar convite.', 'error');
          navigate('/team');
        }
      }
    };

    processInvitation();
  }, [inviteTeamId, user]);

  // Carrega informações do time atual
  useEffect(() => {
    if (user?.teamId) {
      const fetchTeamInfo = async () => {
        try {
          const teamSnap = await getDoc(doc(db, 'teams', user.teamId));
          if (teamSnap.exists()) {
            setTeamName(teamSnap.data().name);
          } else {
            setTeamName(user.teamId.toUpperCase());
          }
        } catch (err) {
          console.error(err);
        }
      };

      fetchTeamInfo();

      // Escuta membros
      const unsubMembers = listenTeamMembers(user.teamId, setMembers);
      
      // Escuta logs de auditoria recentes do time
      const unsubAudit = listenAuditLogs(user.teamId, (logs) => {
        setActivities(logs.slice(0, 15));
      });

      return () => {
        unsubMembers();
        unsubAudit();
      };
    }
  }, [user?.teamId]);

  const handleCopyLink = () => {
    if (!user?.teamId) return;
    const inviteUrl = `${window.location.origin}/invite/${user.teamId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    showToast('Link de convite copiado!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !user?.teamId) return;
    setInviting(true);

    try {
      // Nota: Em um ambiente de produção real, enviaríamos um e-mail de convite ou registraríamos na coleção 'invites'.
      // Como simulador, vamos copiar o link de convite e exibir o sucesso.
      showToast(`Convite gerado para ${inviteEmail}! Encaminhe o link de convite.`, 'success');
      handleCopyLink();
      setInviteEmail('');
    } catch (err) {
      console.error(err);
      showToast('Falha ao gerar convite.', 'error');
    } finally {
      setInviting(false);
    }
  };

  if (!user?.teamId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-slate-900/20 rounded-2xl border border-slate-800/60 backdrop-blur-xl">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Sem Squad Associado</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          Você ainda não possui nenhum squad configurado como ativo. Por favor, acesse as configurações do seu perfil para se associar a um time.
        </p>
        <button onClick={() => navigate('/profile')} className="btn-primary px-5 py-2.5 text-xs font-semibold rounded-xl">
          Configurar no Perfil
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Espaço do Time
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            {teamName}
          </h1>
          <p className="text-sm text-slate-400">
            Acompanhe integrantes, convites e atividades recentes do seu squad.
          </p>
        </div>

        {/* Botão Copiar Convite */}
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all shadow-md self-start"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Link2 className="h-4 w-4 text-indigo-400" />}
          <span>{copied ? 'Copiado!' : 'Copiar Link de Convite'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: LISTA DE INTEGRANTES */}
        <div className="lg:col-span-2 space-y-8">
          <BentoCard title="Integrantes do Squad" subtitle="Visualização em tempo real" icon={Users}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map((member) => (
                <div 
                  key={member.uid} 
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-950/40 border border-slate-900 hover:border-slate-800 transition-all group relative overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar photoURL={member.photoURL} displayName={member.displayName} sizeClass="h-11 w-11" textClass="text-sm font-bold" />
                    <div>
                      <h4 className="font-bold text-white text-xs group-hover:text-indigo-400 transition-colors">
                        {member.displayName || 'Membro do Time'}
                      </h4>
                      <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{member.email}</p>
                    </div>
                  </div>
                  
                  {/* Badge de Cargo */}
                  <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-1 rounded-full border ${getRoleBadgeClass(member.jobRole)}`}>
                    {member.jobRole || 'Membro'}
                  </span>
                </div>
              ))}
            </div>
          </BentoCard>

          {/* ATIVIDADE RECENTE DO TIME */}
          <BentoCard title="Logs de Atividade" subtitle="Histórico recente de ações" icon={Activity}>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {activities.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-6">Nenhuma atividade recente registrada.</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="flex gap-3 text-xs p-3 rounded-lg bg-slate-950/20 border border-slate-900">
                    <UserAvatar photoURL={act.userPhoto} displayName={act.userName} sizeClass="h-7 w-7" textClass="text-[9px] font-bold" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-200">{act.userName}</span>
                        <span className="text-[9px] text-slate-500">
                          {act.timestamp?.seconds ? new Date(act.timestamp.seconds * 1000).toLocaleTimeString('pt-BR') : ''}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{act.details}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </BentoCard>
        </div>

        {/* COLUNA DIREITA: CONVITES & MÉTRICAS */}
        <div className="space-y-8">
          
          {/* CONVIDAR INTEGRANTE */}
          <BentoCard title="Adicionar Integrante" subtitle="Convide novos membros para o time" icon={UserPlus}>
            <form onSubmit={handleSendInvite} className="space-y-4">
              <p className="text-xs text-slate-400">
                Informe o e-mail corporativo do colaborador para gerar e copiar um link exclusivo de onboarding para este time.
              </p>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span>E-mail Corporativo</span>
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="exemplo@empresa.com"
                  className="premium-input text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={inviting}
                className="w-full btn-primary py-2.5 text-xs flex items-center justify-center gap-2"
              >
                {inviting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Convidar Membro</span>
                  </>
                )}
              </button>
            </form>
          </BentoCard>

          {/* INFORMAÇÕES DO SQUAD */}
          <BentoCard title="Detalhes do Squad" subtitle="Dados técnicos do time" icon={ShieldCheck}>
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-900">
                <span className="text-slate-500">Identificador (Slug)</span>
                <span className="font-mono text-slate-300 font-bold select-all bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                  {user.teamId}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-900">
                <span className="text-slate-500">Total de Integrantes</span>
                <span className="font-bold text-white">{members.length}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Link de Acesso Direto</span>
                <button 
                  onClick={handleCopyLink}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar URL</span>
                </button>
              </div>
            </div>
          </BentoCard>

        </div>
      </div>
    </div>
  );
};

export default Team;
