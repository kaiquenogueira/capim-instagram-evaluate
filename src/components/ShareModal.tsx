'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Send, Loader2, CheckCircle, FileText } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (email: string) => Promise<void>;
  isSending: boolean;
}

export default function ShareModal({ isOpen, onClose, onSend, isSending }: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    await onSend(email);
    setSent(true);
    
    // Close after success
    setTimeout(() => {
      setSent(false);
      setEmail('');
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="bg-capim-600 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <Mail className="text-white" size={24} />
                  </div>
                  <h3 className="text-xl font-bold">Enviar Relatório</h3>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-capim-100 text-sm leading-relaxed">
                Digite seu e-mail abaixo para receber o relatório completo em PDF com todas as análises e insights.
              </p>
            </div>

            <div className="p-6">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-lime-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="text-lime-600" size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-neutral-900 mb-2">E-mail enviado!</h4>
                  <p className="text-neutral-500">Verifique sua caixa de entrada em alguns instantes.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Seu melhor e-mail
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="exemplo@email.com"
                        className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-capim-500 focus:border-transparent outline-none transition-all"
                      />
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    </div>
                  </div>

                  <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 flex items-start gap-3">
                    <FileText className="text-capim-600 shrink-0 mt-0.5" size={20} />
                    <div className="text-xs text-neutral-600">
                      <p className="font-semibold text-neutral-800 mb-0.5">O que será enviado?</p>
                      <p>Um arquivo PDF contendo a análise completa do perfil, incluindo pontuações, gráficos e dicas de melhoria.</p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSending || !email}
                    className="w-full py-3.5 bg-capim-600 hover:bg-capim-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-capim-600/20"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Gerando PDF e Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Enviar Relatório</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}