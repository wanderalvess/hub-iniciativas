import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquarePlus, Send, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { submitFeedback } from '../services/firestore';

export function FeedbackWidget({ toolName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: NPS, 2: Comentário, 3: Sucesso
  const [score, setScore] = useState(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { addToast } = useToast();

  const handleClose = () => {
    setIsOpen(false);
    // Reset state after animation ends
    setTimeout(() => {
      setStep(1);
      setScore(null);
      setComment('');
    }, 300);
  };

  const handleScoreSelect = (val) => {
    setScore(val);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (score === null && !comment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await submitFeedback({
        tool: toolName || 'Global',
        score: score !== null ? score : -1,
        comment: comment.trim(),
        userEmail: user?.email || 'anonimo',
        userName: user?.displayName || 'Membro do Time',
        userAgent: navigator.userAgent,
        pathname: window.location.pathname
      });

      // Save submission time to avoid spam
      localStorage.setItem(`feedback_sent_${toolName || 'Global'}`, Date.now().toString());
      setStep(3);
      addToast('Feedback enviado com sucesso!', 'success');
      setTimeout(() => handleClose(), 2000);
    } catch (err) {
      console.error(err);
      addToast('Erro ao enviar feedback.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = (val) => {
    if (val <= 6) return 'hover:bg-rose-500/20 hover:text-rose-400 border-rose-500/20 text-rose-500 bg-rose-500/5';
    if (val <= 8) return 'hover:bg-amber-500/20 hover:text-amber-400 border-amber-500/20 text-amber-500 bg-amber-500/5';
    return 'hover:bg-emerald-500/20 hover:text-emerald-400 border-emerald-500/20 text-emerald-500 bg-emerald-500/5';
  };

  return (
    <>
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-4 right-4 z-[45]"
        >
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 border border-indigo-500/20 hover:border-indigo-500/50 hover:bg-slate-800 text-white rounded-xl shadow-[0_0_10px_rgba(99,102,241,0.1)] text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 pointer-events-auto"
          >
            <MessageSquarePlus className="h-3.5 w-3.5 text-indigo-400" />
            <span>Sugerir Melhoria</span>
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="w-full max-w-[340px] bg-slate-900/95 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-auto overflow-hidden text-white"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60 bg-slate-950/20">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400">Feedback</h4>
                  <p className="text-[9px] text-slate-400 font-mono font-bold capitalize">Módulo: {toolName || 'Geral'}</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <p className="text-xs text-slate-400 text-center leading-relaxed font-semibold">
                        Qual a probabilidade de você recomendar esta ferramenta para um colega?
                      </p>
                      
                      <div className="flex flex-wrap justify-between gap-1">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                          <button
                            key={val}
                            onClick={() => handleScoreSelect(val)}
                            className={`flex-1 min-w-[24px] aspect-square rounded-lg flex items-center justify-center text-[10px] font-black transition-all border hover:scale-110 shadow-sm ${getScoreColor(val)}`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>

                      <div className="flex justify-between text-[8px] uppercase tracking-widest font-extrabold text-slate-500">
                        <span>0 - Pouco</span>
                        <span>10 - Muito</span>
                      </div>

                      <div className="pt-3 border-t border-slate-800/60">
                        <button
                          type="button"
                          onClick={() => { setScore(null); setStep(2); }}
                          className="w-full text-center text-[9px] font-extrabold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Quero apenas enviar uma sugestão
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <p className="text-xs text-slate-300 font-bold text-center flex items-center justify-center gap-2">
                        {score !== null && (
                          <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black text-slate-950 ${
                            score <= 6 ? 'bg-rose-500' : score <= 8 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}>
                            {score}
                          </span>
                        )}
                        {score !== null && score >= 9 ? 'Excelente! O que você mais gostou?' : 'O que podemos melhorar?'}
                      </p>

                      <textarea
                        autoFocus
                        placeholder="Escreva sua sugestão ou comentário opcional..."
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        className="premium-input text-xs min-h-[90px] resize-none bg-slate-950/60"
                      />

                      <div className="flex gap-2 w-full pt-1">
                        <button
                          type="button"
                          className="flex-1 btn-secondary py-2 text-xs rounded-xl"
                          onClick={() => setStep(1)}
                        >
                          Voltar
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="flex-[2] btn-primary py-2 text-xs rounded-xl flex items-center justify-center gap-1"
                        >
                          <span>{isSubmitting ? 'Enviando...' : 'Enviar'}</span>
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-6 space-y-3 text-center"
                    >
                      <CheckCircle className="w-12 h-12 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]" />
                      <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Muito obrigado pelo feedback!</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
