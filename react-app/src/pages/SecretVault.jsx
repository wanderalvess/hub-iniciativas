import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { encryptSecret } from '../utils/vault-crypto';
import BentoCard from '../components/BentoCard';
import { ShieldCheck, Trash2, Copy, Zap, Clock, Lock, Terminal, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SecretVault = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [secret, setSecret] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [expiration, setExpiration] = useState('once');

  const handleGenerate = async () => {
    if (!secret.trim()) {
      showToast('Insira o dado que deseja proteger.', 'error');
      return;
    }

    setIsEncrypting(true);
    try {
      const { ciphertext, key, iv } = await encryptSecret(secret);
      
      const docRef = await addDoc(collection(db, 'vault_secrets'), {
        payload: ciphertext,
        iv,
        expirationType: expiration,
        createdAt: serverTimestamp() || new Date(),
        isBurned: false,
        expiresAt: expiration === '1h' ? new Date(Date.now() + 3600000)
          : expiration === '24h' ? new Date(Date.now() + 86400000) : null,
      });

      // Constrói a URL para leitura
      const origin = window.location.origin;
      setGeneratedLink(`${origin}/vault/${docRef.id}#${key}`);
      showToast('Cofre criptografado com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao criar o cofre criptografado.', 'error');
    } finally {
      setIsEncrypting(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    showToast('Link copiado para a área de transferência!', 'success');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 selection:bg-emerald-500/30">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shadow-md">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Secret <span className="text-emerald-400">Vault</span>
          </h1>
          <p className="text-xs text-slate-400">
            Protocolo E2EE corporativo para compartilhar senhas, chaves de API e segredos confidenciais com autodestruição.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!generatedLink ? (
          <motion.div
            key="creator-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <BentoCard title="Cofre de Segredos" subtitle="Criptografia AES-256-GCM no Navegador">
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5" /> Conteúdo Confidencial
                    </label>
                    <span className="text-[9px] px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 font-bold uppercase tracking-wider">
                      Criptografia Local
                    </span>
                  </div>
                  <textarea
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="Insira aqui senhas, credenciais, tokens de API ou qualquer dado sensível que precise de proteção total..."
                    className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 rounded-xl p-4 min-h-[160px] font-mono text-sm placeholder-slate-600 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  {/* Expiration selection */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-400 ml-1">Validade do Link</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'once', label: 'Uso Único', icon: Trash2 },
                        { id: '1h', label: '1 Hora', icon: Clock },
                        { id: '24h', label: '24 Horas', icon: Zap },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setExpiration(opt.id)}
                          className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                            expiration === opt.id
                              ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/10 scale-102'
                              : 'bg-slate-950/50 border-slate-850 text-slate-500 hover:bg-slate-900 hover:text-slate-200 dark:text-slate-400'
                          }`}
                        >
                          <opt.icon className="h-4.5 w-4.5" />
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-end">
                    <button
                      onClick={handleGenerate}
                      disabled={isEncrypting || !secret.trim()}
                      className="h-16 w-full bg-slate-900 hover:bg-emerald-600 text-white dark:bg-slate-950/40 dark:border dark:border-slate-800 dark:hover:bg-emerald-600 rounded-xl font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2.5 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.1)] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {isEncrypting ? (
                        <>
                          <Zap className="h-4.5 w-4.5 animate-spin text-white" />
                          <span>Criptografando...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4.5 w-4.5 text-white" />
                          <span>Gerar Link Seguro</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </BentoCard>

            {/* Protections list */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-2 opacity-60">
              {[
                { label: "Criptografia Local (E2EE)", icon: ShieldCheck },
                { label: "Zero-Knowledge", icon: Lock },
                { label: "Autodestruição Imediata", icon: Trash2 }
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="result-display"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6 max-w-2xl mx-auto"
          >
            <div className="text-center space-y-3 py-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/5">
                <CheckCircle2 className="h-8 w-8 animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">
                Link <span className="text-emerald-400">Seguro Criado!</span>
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                O link contendo a chave de descriptografia foi gerado. Envie para o destinatário.
              </p>
            </div>

            <BentoCard title="Link de Compartilhamento" subtitle="Não envie a chave separadamente">
              <div className="space-y-6 pt-2">
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-850 break-all font-mono text-xs text-emerald-400 select-all leading-relaxed shadow-inner">
                  {generatedLink}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={copyLink}
                    className="flex-1 h-12 bg-white text-slate-950 hover:bg-emerald-500 hover:text-white rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <Copy className="h-4 w-4" /> Copiar Link
                  </button>
                  <button
                    onClick={() => { setGeneratedLink(''); setSecret(''); }}
                    className="h-12 px-6 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 rounded-xl font-bold uppercase tracking-wider text-xs transition-all"
                  >
                    Criar Novo Segredo
                  </button>
                </div>

                <div className="flex items-center gap-3 bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                  <p className="text-[10px] text-rose-300 font-bold uppercase tracking-wide">
                    Aviso: O conteúdo será permanentemente apagado após a primeira leitura ou expiração.
                  </p>
                </div>
              </div>
            </BentoCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SecretVault;
