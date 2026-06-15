import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  listenEnvironments, 
  listenAISkills,
  listenFeedPosts,
  reserveEnvironment
} from '../services/firestore';
import BentoCard from '../components/BentoCard';
import UserAvatar from '../components/UserAvatar';
import { 
  User, 
  Server, 
  Cpu, 
  Settings, 
  LogOut, 
  MessageSquare, 
  GitBranch, 
  ArrowRight,
  Activity,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [vms, setVms] = useState([]);
  const [skills, setSkills] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (!user?.teamId) return;
    const unsubVms = listenEnvironments(user.teamId, setVms);
    const unsubSkills = listenAISkills(user.teamId, setSkills);
    const unsubPosts = listenFeedPosts(user.teamId, setPosts);

    return () => {
      unsubVms();
      unsubSkills();
      unsubPosts();
    };
  }, [user?.teamId]);

  const handleReserveVm = async (vmId, vmName, currentStatus) => {
    try {
      await reserveEnvironment(vmId, vmName, user, currentStatus);
    } catch (err) {
      console.error('Erro ao gerenciar VM:', err);
    }
  };

  // Filtrar VMs reservadas pelo usuário atual
  const myReservedVms = vms.filter(vm => vm.status === 'em_uso' && vm.currentUserUid === user?.uid);
  const totalAvailableVms = vms.filter(vm => vm.status === 'disponivel').length;

  return (
    <div className="space-y-8">
      
      {/* HEADER DE BOAS VINDAS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Olá, {user?.displayName?.split(' ')[0] || 'Membro'}!
          </h1>
          <p className="text-sm text-slate-400">Seja bem-vindo de volta ao centro de operações FlexiHub.</p>
        </div>
        
        {user?.teamId && (
          <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl backdrop-blur-md">
            <span className="text-xs font-semibold text-slate-300">
              Squad: <strong className="text-indigo-400 font-bold uppercase">{user.teamId.replace('-', ' ')}</strong>
            </span>
          </div>
        )}
      </div>

      {/* BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: PERFIL DO USUÁRIO (1 col) */}
        <BentoCard title="Meu Perfil" subtitle="Squad corporativo" icon={User} className="md:col-span-1 flex flex-col justify-between">
          <div className="flex flex-col items-center text-center py-4">
            <div className="relative mb-4">
              <UserAvatar photoURL={user?.photoURL} displayName={user?.displayName} sizeClass="h-20 w-20" textClass="text-2xl font-bold" />
              <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-emerald-500 border-2 border-slate-950"></span>
            </div>
            <h4 className="text-lg font-bold text-white mb-1 truncate max-w-full">{user?.displayName}</h4>
            <p className="text-xs text-slate-400 mb-4 truncate max-w-full">{user?.email}</p>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              user?.role === 'admin' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
            }`}>
              {user?.role === 'admin' ? 'Administrador' : 'Membro'}
            </span>
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800/80">
            <Link to="/profile" className="flex-1 btn-secondary py-2 text-xs flex items-center justify-center gap-1.5 rounded-lg">
              <Settings className="h-3.5 w-3.5" />
              <span>Editar</span>
            </Link>
            <button onClick={() => logout()} className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 py-2 text-xs flex items-center justify-center gap-1.5 rounded-lg transition-all">
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </BentoCard>

        {/* CARD 2: PAINEL DE ATALHOS E ATIVIDADES GERAIS (2 cols) */}
        <BentoCard title="Acesso Rápido & Status" subtitle="Atalhos da plataforma" icon={Activity} className="md:col-span-2">
          
          {/* Grid de Atalhos Rápidos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <Link to="/feed" className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-center flex flex-col items-center gap-2 group">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 text-indigo-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-slate-300">Feed de Iniciativas</span>
              <span className="text-[10px] text-slate-500">{posts.length} posts ativos</span>
            </Link>

            <Link to="/environments" className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-center flex flex-col items-center gap-2 group">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 text-indigo-400">
                <Server className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-slate-300">Ambientes / VMs</span>
              <span className="text-[10px] text-slate-500">{totalAvailableVms} livres de {vms.length}</span>
            </Link>

            <Link to="/workflows" className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-center flex flex-col items-center gap-2 col-span-2 sm:col-span-1 group">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 text-indigo-400">
                <GitBranch className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-slate-300">Rotas & Workflows</span>
              <span className="text-[10px] text-slate-500">Desenho e imports</span>
            </Link>
          </div>

          {/* Seção Informativa de VMs Reservadas por Mim */}
          <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Server className="h-4 w-4 text-indigo-400" />
              <span>Minhas Reservas Ativas</span>
            </h5>

            {myReservedVms.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center bg-slate-900/10 rounded-lg border border-dashed border-slate-900">
                Você não possui nenhuma VM reservada no momento.
              </p>
            ) : (
              <div className="space-y-2.5">
                {myReservedVms.map((vm) => (
                  <div key={vm.id} className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-800 rounded-lg">
                    <div>
                      <span className="text-xs font-bold text-white block">{vm.name}</span>
                      <span className="text-[10px] text-slate-400">{vm.ip || 'Sem IP'}</span>
                    </div>
                    <button
                      onClick={() => handleReserveVm(vm.id, vm.name, vm.status)}
                      className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded text-[10px] font-bold transition-all"
                    >
                      Liberar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </BentoCard>

        {/* CARD 3: ÚLTIMAS SKILLS HOMOLOGADAS (3 cols) */}
        <BentoCard title="Catálogo AI Skills Destaques" subtitle="Modelos de prompts homologados" icon={Cpu} className="md:col-span-3">
          {skills.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Nenhuma Skill homologada ainda.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {skills.slice(0, 3).map((skill) => (
                <div key={skill.id} className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl hover:border-slate-800/80 transition-all flex flex-col justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-xs text-white mb-1 truncate">{skill.name}</h5>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{skill.description}</p>
                  </div>
                  <Link 
                    to="/skills" 
                    className="w-full py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center justify-center gap-1 rounded transition-all"
                  >
                    <span>Ver Prompts</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </BentoCard>

      </div>

    </div>
  );
};

export default Dashboard;
