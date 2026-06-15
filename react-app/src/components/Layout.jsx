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
  
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'dark';
  });

  useEffect(() => {
    if (user?.themeMode) {
      setThemeMode(user.themeMode);
      localStorage.setItem('themeMode', user.themeMode);
    }
  }, [user?.themeMode]);

  const toggleThemeMode = async () => {
    const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextTheme);
    localStorage.setItem('themeMode', nextTheme);
    
    if (user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { themeMode: nextTheme });
      } catch (err) {
        console.error("Erro ao salvar tema do usuário:", err);
      }
    }
  };

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

      /* Light Theme Overrides */
      .light-theme {
        background-color: #f8fafc !important;
        color: #0f172a !important;
      }
      .light-theme input,
      .light-theme select,
      .light-theme textarea {
        color: #0f172a;
      }
      .light-theme .bg-slate-950 {
        background-color: #f1f5f9 !important;
      }
      .light-theme .bg-slate-900 {
        background-color: #ffffff !important;
      }
      .light-theme .bg-slate-900\\/60,
      .light-theme .bg-slate-950\\/60,
      .light-theme .bg-slate-950\\/80 {
        background-color: rgba(255, 255, 255, 0.85) !important;
        backdrop-filter: blur(8px);
      }
      .light-theme .bg-slate-900\\/30,
      .light-theme .bg-slate-900\\/40,
      .light-theme .bg-slate-950\\/20,
      .light-theme .bg-slate-950\\/40 {
        background-color: #f1f5f9 !important;
      }
      .light-theme .bg-slate-900\\/90,
      .light-theme .bg-slate-900\\/95 {
        background-color: #ffffff !important;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1) !important;
      }
      .light-theme .bg-slate-950\\/10,
      .light-theme .bg-slate-900\\/20,
      .light-theme .bg-slate-900\\/10 {
        background-color: rgba(0, 0, 0, 0.04) !important;
      }
      .light-theme .bg-indigo-950\\/40 {
        background-color: rgba(99, 102, 241, 0.12) !important;
      }
      .light-theme .bg-slate-900\\/60 {
        background-color: rgba(71, 85, 105, 0.08) !important;
      }
      .light-theme .bg-emerald-950\\/40 {
        background-color: rgba(16, 185, 129, 0.12) !important;
      }
      .light-theme .bg-teal-900\\/40 {
        background-color: rgba(20, 184, 166, 0.12) !important;
      }
      .light-theme .bg-amber-950\\/40 {
        background-color: rgba(245, 158, 11, 0.12) !important;
      }
      .light-theme .bg-sky-950\\/40 {
        background-color: rgba(14, 165, 233, 0.12) !important;
      }
      .light-theme .bg-purple-950\\/40 {
        background-color: rgba(168, 85, 247, 0.12) !important;
      }
      .light-theme .bg-rose-950\\/40 {
        background-color: rgba(244, 63, 94, 0.12) !important;
      }
      .light-theme .bg-cyan-950\\/40 {
        background-color: rgba(6, 182, 212, 0.12) !important;
      }
      .light-theme .bg-orange-950\\/40 {
        background-color: rgba(249, 115, 22, 0.12) !important;
      }
      .light-theme .bg-violet-950\\/40 {
        background-color: rgba(139, 92, 246, 0.12) !important;
      }
      .light-theme .bg-gray-900\\/40 {
        background-color: rgba(100, 116, 139, 0.12) !important;
      }
      .light-theme .premium-input {
        background-color: #ffffff !important;
        border-color: #cbd5e1 !important;
        color: #0f172a !important;
      }
      .light-theme .premium-input:focus {
        border-color: ${primary} !important;
      }
      .light-theme .text-white,
      .light-theme .text-slate-50,
      .light-theme .text-slate-100,
      .light-theme .text-slate-200,
      .light-theme .text-slate-300 {
        color: #0f172a !important;
      }
      .light-theme .text-slate-400,
      .light-theme .text-slate-500 {
        color: #475569 !important;
      }
      .light-theme .text-slate-600,
      .light-theme .text-slate-700 {
        color: #64748b !important;
      }
      .light-theme .text-indigo-400,
      .light-theme .text-indigo-500,
      .light-theme .text-indigo-600 {
        color: ${primary} !important;
      }
      .light-theme .text-emerald-400,
      .light-theme .text-emerald-500 {
        color: #059669 !important;
      }
      .light-theme .text-emerald-600 {
        color: #047857 !important;
      }
      .light-theme .text-amber-400,
      .light-theme .text-amber-500 {
        color: #d97706 !important;
      }
      .light-theme .text-rose-400,
      .light-theme .text-rose-500,
      .light-theme .text-red-400,
      .light-theme .text-red-500 {
        color: #e11d48 !important;
      }
      .light-theme .text-sky-400,
      .light-theme .text-sky-500,
      .light-theme .text-blue-400,
      .light-theme .text-blue-500 {
        color: #0284c7 !important;
      }
      .light-theme .text-purple-400,
      .light-theme .text-purple-500,
      .light-theme .text-violet-400,
      .light-theme .text-violet-500 {
        color: #7c3aed !important;
      }
      .light-theme .border-slate-800,
      .light-theme .border-slate-800\\/80,
      .light-theme .border-slate-900,
      .light-theme .border-slate-900\\/40,
      .light-theme .border-slate-900\\/60,
      .light-theme .border-slate-900\\/80 {
        border-color: #cbd5e1 !important;
      }
      .light-theme .hover\\:border-slate-800:hover,
      .light-theme .hover\\:border-slate-700\\/60:hover {
        border-color: #94a3b8 !important;
      }
      .light-theme .bento-card {
        background-color: rgba(255, 255, 255, 0.8) !important;
        border-color: #cbd5e1 !important;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03) !important;
      }
      .light-theme .bento-card:hover {
        border-color: #94a3b8 !important;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04) !important;
      }
      .light-theme .bg-slate-950\\/80 {
        background-color: rgba(255, 255, 255, 0.9) !important;
      }
      .light-theme .bg-slate-950\\/95 {
        background-color: rgba(255, 255, 255, 0.98) !important;
      }
      .light-theme aside {
        background-color: #ffffff !important;
        border-color: #cbd5e1 !important;
      }
      .light-theme .text-slate-400:hover,
      .light-theme .text-slate-500:hover {
        color: #0f172a !important;
      }
      .light-theme .hover\\:text-slate-200:hover {
        color: #0f172a !important;
      }
      .light-theme .hover\\:text-slate-300:hover {
        color: #0f172a !important;
      }
      .light-theme .hover\\:bg-slate-800\\/40:hover {
        background-color: #f1f5f9 !important;
      }
      .light-theme .hover\\:bg-slate-800\\/60:hover {
        background-color: #f1f5f9 !important;
      }
      .light-theme .bg-slate-900\\/95 {
        background-color: #ffffff !important;
        border-color: #cbd5e1 !important;
      }
      .light-theme .bg-slate-800\\/50,
      .light-theme .bg-slate-800\\/30 {
        background-color: #f1f5f9 !important;
        border-color: #cbd5e1 !important;
      }
      .light-theme .bg-slate-800\\/80 {
        background-color: #ffffff !important;
        border-color: #cbd5e1 !important;
      }
      .light-theme .text-rose-400 {
        color: #e11d48 !important;
      }
      .light-theme .hover\\:bg-rose-500\\/10:hover {
        background-color: #ffe4e6 !important;
      }
      .light-theme .bg-slate-800\\/40 {
        background-color: #f1f5f9 !important;
      }
      .light-theme .divide-slate-900\\/40 > * + * {
        border-color: #cbd5e1 !important;
      }
      .light-theme select option {
        background-color: #ffffff !important;
        color: #0f172a !important;
      }
      
      /* Navigation Header and sidebar fixes */
      .light-theme header a,
      .light-theme header button,
      .light-theme nav a,
      .light-theme nav button {
        color: #334155 !important;
      }
      .light-theme header a:hover,
      .light-theme header button:hover,
      .light-theme nav a:hover,
      .light-theme nav button:hover {
        color: #0f172a !important;
      }
      .light-theme a.bg-indigo-600\\/10,
      .light-theme button.bg-indigo-600\\/10 {
        color: ${primary} !important;
      }
      .light-theme a.bg-indigo-600,
      .light-theme button.bg-indigo-600,
      .light-theme .bg-indigo-600,
      .light-theme .bg-indigo-600 span,
      .light-theme .bg-indigo-600 div,
      .light-theme .bg-indigo-600 p,
      .light-theme .bg-indigo-600 a,
      .light-theme .btn-primary,
      .light-theme .btn-primary * {
        color: #ffffff !important;
      }
      .light-theme .bg-slate-800 {
        background-color: #e2e8f0 !important;
        border-color: #cbd5e1 !important;
      }

      /* Badges in light mode for workflows list */
      .light-theme .bg-emerald-500\\/10 {
        background-color: rgba(16, 185, 129, 0.15) !important;
        color: #047857 !important;
        border-color: rgba(16, 185, 129, 0.3) !important;
      }
      .light-theme .bg-indigo-500\\/10 {
        background-color: rgba(99, 102, 241, 0.15) !important;
        color: #4338ca !important;
        border-color: rgba(99, 102, 241, 0.3) !important;
      }
      .light-theme .bg-amber-500\\/10 {
        background-color: rgba(245, 158, 11, 0.15) !important;
        color: #b45309 !important;
        border-color: rgba(245, 158, 11, 0.3) !important;
      }
      .light-theme .bg-rose-500\\/10 {
        background-color: rgba(244, 63, 94, 0.15) !important;
        color: #be123c !important;
        border-color: rgba(244, 63, 94, 0.3) !important;
        color: #be123c !important;
      }
      .light-theme .bg-purple-500\\/10 {
        background-color: rgba(168, 85, 247, 0.15) !important;
        color: #7e22ce !important;
        border-color: rgba(168, 85, 247, 0.3) !important;
      }
      .light-theme .bg-sky-500\\/10 {
        background-color: rgba(14, 165, 233, 0.15) !important;
        color: #0369a1 !important;
        border-color: rgba(14, 165, 233, 0.3) !important;
      }
      
      .light-theme .text-indigo-200 {
        color: ${primary} !important;
      }
      .light-theme .bg-indigo-600\\/10 {
        background-color: ${primary}15 !important;
      }
      .light-theme select {
        color: #0f172a !important;
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
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden ${themeMode === 'light' ? 'light-theme' : ''}`}>
      
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

        <div className="flex items-center gap-3">
          {/* Alternador de Tema Claro/Escuro */}
          <button
            onClick={toggleThemeMode}
            className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-800 hover:border-slate-700/60 transition-all text-slate-400 hover:text-white flex items-center justify-center"
            title={themeMode === 'dark' ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
          >
            {themeMode === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M9.75 12a2.25 2.25 0 1 1 4.5 0M4.912 4.912l1.59 1.59m11.2 11.2 1.59 1.59M3 12h2.25m13.5 0H21M5.92 18.08l1.59-1.59M18.08 5.92l-1.59 1.59" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            )}
          </button>

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
        </div>
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
