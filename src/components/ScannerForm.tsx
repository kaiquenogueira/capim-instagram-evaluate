'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Instagram, ArrowRight } from 'lucide-react';

interface ScannerFormProps {
  onScan: (handle: string) => void;
  errorMessage?: string;
}

export default function ScannerForm({ onScan, errorMessage }: ScannerFormProps) {
  const [handle, setHandle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (errorMessage) {
      setError(errorMessage);
    }
  }, [errorMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) {
      setError('Por favor, digite um usuário do Instagram.');
      return;
    }
    
    let cleanHandle = handle.trim();
    if (cleanHandle.startsWith('@')) {
      cleanHandle = cleanHandle.substring(1);
    }

    if (cleanHandle.length < 2) {
      setError('Nome de usuário muito curto.');
      return;
    }

    onScan(cleanHandle);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="bg-white rounded-3xl shadow-xl p-7 md:p-9 border border-neutral-200/60">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="space-y-3">
            <label htmlFor="handle" className="text-base font-medium text-neutral-700 ml-1">
              Perfil do Instagram da Clínica
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <svg width="0" height="0">
                  <linearGradient id="instagram-gradient" x1="100%" y1="100%" x2="0%" y2="0%">
                    <stop stopColor="#f09433" offset="0%" />
                    <stop stopColor="#e6683c" offset="25%" />
                    <stop stopColor="#dc2743" offset="50%" />
                    <stop stopColor="#cc2366" offset="75%" />
                    <stop stopColor="#bc1888" offset="100%" />
                  </linearGradient>
                </svg>
                <Instagram size={28} style={{ stroke: "url(#instagram-gradient)" }} />
              </div>
              <input
                type="text"
                id="handle"
                value={handle}
                onChange={(e) => {
                  setHandle(e.target.value);
                  setError('');
                }}
                placeholder="@suaclinica"
                className="block w-full pl-16 pr-4 py-5 bg-white border border-neutral-200 rounded-2xl text-xl focus:ring-4 focus:ring-capim-200 focus:border-capim-500 outline-none transition-all placeholder:text-neutral-300 shadow-sm"
                autoComplete="off"
              />
            </div>
            {error && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="text-red-500 text-base ml-1"
              >
                {error}
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            className="group w-full bg-capim-600 hover:bg-capim-700 text-white text-lg font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-capim-600/25"
          >
            <span>Iniciar Análise</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-neutral-400">
            Análise baseada em dados públicos e IA. Não solicitamos senha.
          </p>
        </div>
      </div>
    </motion.div>
  );
}