import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ShieldAlert, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setError('');
    setLoadingSubmit(true);

    try {
      await loginWithEmail(email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Falha na autenticação: E-mail ou senha incorretos.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Falha ao autenticar com a conta Google corporativa.');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-slate-950 px-4">
      
      {/* Container Principal Animado */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        {/* Efeito Glow superior */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>

        <div className="text-center mb-8">
          <span className="inline-block bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-3">
            V&D Varejo e Distribuição
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 bg-gradient-to-r from-white via-indigo-200 to-slate-400 bg-clip-text text-transparent">
            Hub de Iniciativas
          </h1>
          <p className="text-sm text-slate-400">Entre na sua conta corporativa</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm"
          >
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Endereço de E-mail
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Mail className="h-5 w-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@totvs.com.br"
                className="premium-input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Senha de Acesso
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="premium-input pl-10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingSubmit}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {loadingSubmit ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                <span>Entrar no Hub</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <span className="relative bg-[#0b0f19] px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ou acesse via corporativo
            </span>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="btn-secondary w-full flex items-center justify-center gap-3"
          >
            {/* Google Icon SVG */}
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.745 1.055 15.018 0 12 0 7.355 0 3.309 2.69 1.255 6.618l4.01 3.147z"
              />
              <path
                fill="#4285F4"
                d="M23.455 12.273c0-.818-.073-1.609-.209-2.373H12v4.51h6.436c-.277 1.464-1.1 2.709-2.345 3.545v2.946h3.791c2.218-2.046 3.573-5.055 3.573-8.628z"
              />
              <path
                fill="#FBBC05"
                d="M5.266 14.235A7.02 7.02 0 014.91 12c0-.79.136-1.545.356-2.235L1.255 6.618A11.933 11.933 0 000 12c0 1.927.455 3.736 1.255 5.382l4.01-3.147z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.245 0 5.973-1.073 7.964-2.909l-3.791-2.946c-1.055.709-2.4 1.127-4.173 1.127-3.218 0-5.945-2.173-6.918-5.091L1.073 17.3c2.054 3.927 6.1 6.7 10.927 6.7z"
              />
            </svg>
            <span>Entrar com o Google</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
};

export default Login;
