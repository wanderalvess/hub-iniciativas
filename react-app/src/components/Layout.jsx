import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Server, 
  GitBranch, 
  Cpu, 
  User, 
  Users,
  LogOut, 
  ChevronRight, 
  Menu, 
  X,
  Sparkles,
  LayoutDashboard,
  MessageSquare,
  ChevronLeft,
  HelpCircle,
  BookOpen,
  History,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserAvatar from './UserAvatar';
import { FeedbackWidget } from './FeedbackWidget';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [supportDropdownOpen, setSupportDropdownOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const primary = user?.themePrimary || '#6366f1';
    const secondary = user?.themeSecondary || '#a855f7';
    
    const styleId = 'dynamic-neon-theme';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    
    styleEl.innerHTML = `
      :root {
        --brand-primary: ${primary};
        --brand-secondary: ${secondary};
      }
      .btn-primary {
        background-color: ${primary} !important;
        box-shadow: 0 4px 20px ${primary}40 !important;
      }
      .btn-primary:hover {
        background-color: ${primary}dd !important;
        box-shadow: 0 4px 25px ${primary}60 !important;
      }
      .text-indigo-400 {
        color: ${primary} !important;
      }
      .text-indigo-500 {
        color: ${primary} !important;
      }
      .bg-indigo-600 {
        background-color: ${primary} !important;
      }
      .bg-indigo-500\\/5 {
        background-color: ${primary}0c !important;
      }
      .bg-indigo-500\\/10 {
        background-color: ${primary}1a !important;
      }
      .border-indigo-500 {
        border-color: ${primary} !important;
      }
      .border-indigo-500\\/20 {
        border-color: ${primary}33 !important;
      }
      .shadow-glow-indigo {
        box-shadow: 0 0 15px 2px ${primary}26 !important;
      }
      .from-indigo-500 {
        --tw-gradient-from: ${primary} !important;
        --tw-gradient-to: ${secondary}00 !important;
        --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
      }
      .to-purple-600 {
        --tw-gradient-to: ${secondary} !important;
      }
    `;
  }, [user?.themePrimary, user?.themeSecondary]);

  const menuItems = [
    { label: 'Painel Geral', path: '/', icon: LayoutDashboard },
    { label: 'Feed de Iniciativas', path: '/feed', icon: MessageSquare },
    { label: 'Meu Time', path: '/team', icon: Users },
    { label: 'Ambientes / VMs', path: '/environments', icon: Server },
    { label: 'Workflows de APIs', path: '/workflows', icon: GitBranch },
    { label: 'AI Skills & Prompts', path: '/skills', icon: Cpu },
    { label: 'Base de Conhecimento', path: '/knowledge', icon: BookOpen },
    { label: 'Notas de Versão', path: '/versions', icon: History },
    { label: 'Ajuda & Suporte', path: '/help', icon: HelpCircle },
  ];

  const activeMenuItem = menuItems.find((item) => item.path === location.pathname);
  const toolName = activeMenuItem ? activeMenuItem.label : 'Geral';

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  const mainMenuItems = menuItems.slice(0, 7);
  const supportMenuItems = menuItems.slice(7);
  const isSupportActive = supportMenuItems.some(item => location.pathname === item.path);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      
      {/* Background radial glow effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100px_100px,#312e81,transparent)] opacity-10 pointer-events-none"></div>

      {/* TOOLBAR SUPERIOR CORPORATIVA */}
      <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-all text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.5)] select-none flex items-center justify-center bg-slate-950 border border-slate-800">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-full h-full">
                <defs>
                  <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="var(--brand-primary, #6366f1)" />
                    <stop offset="100%" stop-color="var(--brand-secondary, #a855f7)" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" fill="url(#logoGrad)" />
                <circle cx="16" cy="16" r="11" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="4 2" opacity="0.4" />
                <path d="M10 16h12M16 10v12" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
                <circle cx="10" cy="16" r="2.5" fill="#ffffff" />
                <circle cx="22" cy="16" r="2.5" fill="#ffffff" />
                <circle cx="16" cy="10" r="2.5" fill="#ffffff" />
                <circle cx="16" cy="22" r="2.5" fill="#ffffff" />
                <circle cx="16" cy="16" r="4" fill="#0f172a" />
                <circle cx="16" cy="16" r="2" fill="#ffffff" />
              </svg>
            </div>
            <span className="font-extrabold tracking-tight text-white text-lg bg-gradient-to-r from-white via-indigo-100 to-slate-400 bg-clip-text text-transparent">
              Hub de Iniciativas
            </span>
          </div>

          {/* ALTERNADOR DE TIME ATIVO */}
          {user?.associatedTeams && user.associatedTeams.length > 1 && (
            <div className="relative ml-2">
              <select
                value={user.teamId}
                onChange={async (e) => {
                  const newTeamId = e.target.value;
                  try {
                    const userRef = doc(db, 'users', user.uid);
                    await updateDoc(userRef, { teamId: newTeamId });
                  } catch (err) {
                    console.error("Erro ao alternar time ativo:", err);
                  }
                }}
                className="bg-slate-800/80 border border-slate-700/80 text-slate-300 text-[10px] font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer uppercase"
              >
                {user.associatedTeams.map((tId) => (
                  <option key={tId} value={tId} className="bg-slate-900 text-slate-300">
                    {tId}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* NAV PRINCIPAL HORIZONTAL (DESKTOP) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isActive 
                    ? 'bg-indigo-600/10 border-indigo-500/30 text-white shadow-glow-indigo' 
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* DROP DOWN SUPORTE */}
          <div className="relative">
            <button
              onClick={() => setSupportDropdownOpen(!supportDropdownOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border outline-none ${
                isSupportActive 
                  ? 'bg-indigo-600/10 border-indigo-500/30 text-white shadow-glow-indigo' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>Suporte</span>
              <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${supportDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {supportDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSupportDropdownOpen(false)}></div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                    className="absolute right-0 mt-1.5 w-44 bg-slate-900/95 border border-slate-800 rounded-lg p-1 shadow-2xl z-20 backdrop-blur-md"
                  >
                    {supportMenuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSupportDropdownOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-indigo-600/20 text-white border-l-2 border-indigo-500'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Perfil do Usuário com Dropdown */}
        {user && (
          <div className="relative">
            <button 
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1 pr-3 rounded-full bg-slate-800/30 border border-slate-800 hover:border-slate-700/60 transition-all outline-none"
            >
              <UserAvatar photoURL={user.photoURL} displayName={user.displayName} sizeClass="h-8 w-8" textClass="text-[9px] font-extrabold" />
              <span className="hidden sm:inline text-xs font-semibold text-slate-300 max-w-[120px] truncate">
                {user.displayName}
              </span>
            </button>

            <AnimatePresence>
              {profileDropdownOpen && (
                <>
                  {/* Overlay invisível para fechar ao clicar fora */}
                  <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)}></div>
                  
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-52 bg-slate-900/95 border border-slate-800 rounded-xl p-2 shadow-2xl z-20 backdrop-blur-md"
                  >
                    <div className="px-3 py-2 border-b border-slate-800 mb-1">
                      <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                    </div>

                    <Link 
                      to="/profile" 
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-sm font-medium"
                    >
                      <User className="h-4 w-4 text-indigo-400" />
                      <span>Meu Perfil</span>
                    </Link>

                    <button 
                      onClick={() => { setProfileDropdownOpen(false); handleLogout(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all text-sm font-medium text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sair / Logout</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </header>      {/* LAYOUT PRINCIPAL */}
      <div className="flex flex-1 relative">

        {/* SIDEBAR DRAWER - MOBILE */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Overlay de fundo */}
              <div 
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 lg:hidden" 
                onClick={() => setMobileMenuOpen(false)}
              ></div>
              
              <motion.aside 
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 bottom-0 left-0 w-64 bg-slate-900 border-r border-slate-800 p-4 z-40 lg:hidden flex flex-col gap-1.5 pt-20"
              >
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group font-medium text-sm ${
                        isActive 
                          ? 'bg-indigo-600 text-white shadow-[0_4px_15px_rgba(99,102,241,0.25)]' 
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    </Link>
                  );
                })}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* CONTEÚDO PRINCIPAL DINÂMICO */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[90rem] mx-auto w-full relative z-10">
          <motion.div 
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>

        {/* Widget de Feedback / NPS */}
        <FeedbackWidget toolName={toolName} />
      </div>
    </div>
  );
};

export default Layout;
