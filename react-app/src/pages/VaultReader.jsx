import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { decryptSecret } from '../utils/vault-crypto';
import BentoCard from '../components/BentoCard';
import { ShieldCheck, ShieldAlert, Lock, Unlock, Trash2, Copy, Zap, AlertTriangle, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

const VaultReader = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const [status, setStatus] = useState('loading'); // loading, ready, revealing, revealed, destroyed, error
  const [secret, setSecret] = useState('');
  const [isRevealing, setIsRevealing] = useState(false);

  const fetchSecret = async () => {
    try {
      const docRef = doc(db, 'vault_secrets', id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setStatus('destroyed');
        return;
      }

      const data = docSnap.data();
      // Checar se expirou por tempo
      if (data.expiresAt) {
        const expiresTime = data.expiresAt.toDate ? data.expiresAt.toDate().getTime() : new Date(data.expiresAt).getTime();
        if (Date.now() > expiresTime) {
          await deleteDoc(docRef);
          setStatus('destroyed');
          return;
        }
      }

      setStatus('ready');
    } catch (error) {
      console.error('Error fetching secret:', error);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (id) {
      fetchSecret();
    }
  }, [id]);

  const handleReveal = async () => {
    setIsRevealing(true);
    setStatus('revealing');

    try {
      const hash = window.location.hash;
      if (!hash || hash.length < 10) {
        setStatus('error');
        showToast('Link inválido ou sem chave de descriptografia.', 'error');
        return;
      }
      const encryptionKey = hash.substring(1); // Remove o '#'

      const docRef = doc(db, 'vault_secrets', id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setStatus('destroyed');
        return;
      }

      const data = docSnap.data();
      
      try {
        const decrypted = await decryptSecret(data.payload, encryptionKey, data.iv);
        setSecret(decrypted);
        
        // Se a validade for de Uso Único (once), apagar imediatamente
        if (data.expirationType === 'once') {
          await deleteDoc(docRef);
        }

        setStatus('revealed');
        showToast('Segredo descriptografado com sucesso!', 'success');
      } catch (e) {
        console.error('Decryption failed:', e);
        setStatus('error');
        showToast('Falha ao descriptografar. A chave do hash está corrompida ou incorreta.', 'error');
      }
    } catch (error) {
      console.error('Reveal error:', error);
      setStatus('error');
    } finally {
      setIsRevealing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secret);
    showToast('Copiado para a área de transferência!', 'success');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[70vh] selection:bg-emerald-500/30">
      <div className="w-full max-w-xl space-y-8">
        <AnimatePresence mode="wait">
          {status === 'loading' && (
            <motion.div 
              key="loading-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Validando Coordenadas do Cofre...</p>
            </motion.div>
          )}

          {status === 'ready' && (
            <motion.div 
              key="ready-state"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg">
                  <ShieldAlert className="h-8 w-8 animate-bounce" />
                </div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">
                  Cofre <span className="text-amber-400">Localizado</span>
                </h2>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Este conteúdo será revelado localmente e <span className="text-rose-400 font-bold underline">excluído em definitivo</span> após a leitura.
                </p>
              </div>

              <BentoCard title="Cofre de Segredos" subtitle="Pronto para descriptografia local">
                <div className="space-y-6 pt-2">
                  <div className="flex items-center justify-center gap-8">
                    <div className="text-center">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-1 text-emerald-400">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">AES-256 E2EE</span>
                    </div>
                    <div className="text-center">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-1 text-rose-400">
                        <Trash2 className="h-4 w-4" />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">Autodestruição</span>
                    </div>
                  </div>

                  <button
                    onClick={handleReveal}
                    disabled={isRevealing}
                    className="w-full h-14 bg-slate-900 border border-slate-800 hover:border-emerald-500/30 hover:bg-emerald-500/5 text-white hover:text-emerald-400 rounded-xl font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-95 group"
                  >
                    {isRevealing ? (
                      <Zap className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Lock className="h-4.5 w-4.5 group-hover:hidden text-indigo-400" />
                        <Unlock className="h-4.5 w-4.5 hidden group-hover:block text-emerald-400" />
                        <span>Revelar Segredo</span>
                      </>
                    )}
                  </button>
                </div>
              </BentoCard>
            </motion.div>
          )}

          {status === 'revealed' && (
            <motion.div 
              key="revealed-state"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg">
                  <Unlock className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">
                  Conteúdo <span className="text-emerald-400">Revelado</span>
                </h2>
                <p className="text-xs text-slate-400">
                  O conteúdo foi carregado na memória. Ele já foi destruído do banco de dados.
                </p>
              </div>

              <BentoCard title="Segredo Descriptografado" subtitle="Copie e armazene em local seguro">
                <div className="space-y-6 pt-2">
                  <textarea
                    value={secret}
                    readOnly
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-sm text-emerald-400 select-all focus:outline-none min-h-[140px] leading-relaxed shadow-inner"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={copyToClipboard}
                      className="flex-1 h-12 bg-white text-slate-950 hover:bg-emerald-500 hover:text-white rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <Copy className="h-4 w-4" /> Copiar para Área de Transferência
                    </button>
                  </div>
                </div>
              </BentoCard>
            </motion.div>
          )}

          {status === 'destroyed' && (
            <motion.div 
              key="destroyed-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-4 max-w-sm mx-auto py-8"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-md">
                <Trash2 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">
                Cofre <span className="text-rose-400">Destruído</span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Este link expirou, já foi acessado anteriormente ou nunca existiu. Por segurança E2EE, as chaves e payload foram permanentemente apagados do servidor.
              </p>
              <Link to="/devtools/secret-vault" className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-white transition-colors pt-2">
                <ChevronLeft className="h-4 w-4" /> Criar Novo Segredo
              </Link>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div 
              key="error-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-4 max-w-sm mx-auto py-8"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-md">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">
                Erro de <span className="text-rose-400">Autenticação</span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Não foi possível descriptografar o cofre. Verifique se o link está completo (incluindo o hash '#' contendo a chave AES).
              </p>
              <Link to="/devtools/secret-vault" className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-white transition-colors pt-2">
                <ChevronLeft className="h-4 w-4" /> Voltar ao Secret Vault
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VaultReader;
