'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScannerForm from '@/components/ScannerForm';
import LoadingOverlay from '@/components/LoadingOverlay';
import ResultsDashboard from '@/components/ResultsDashboard';
import { AnalysisResult } from '@/types';

export default function Home() {
  const [step, setStep] = useState<'idle' | 'scanning' | 'results'>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [handle, setHandle] = useState<string>('');

  const handleStartScan = async (handle: string) => {
    setHandle(handle);
    setStep('scanning');
  };

  const handleScanComplete = (data: AnalysisResult) => {
    setResult(data);
    setStep('results');
  };

  const handleReset = () => {
    setStep('idle');
    setResult(null);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-neutral-900 relative overflow-hidden px-6 py-12">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-capim-400 via-capim-600 to-capim-800 z-50" />
      <div className="absolute -top-24 -right-24 w-[520px] h-[520px] bg-capim-100 rounded-full blur-3xl opacity-60" />
      <div className="absolute -bottom-28 -left-28 w-[520px] h-[520px] bg-neutral-100 rounded-full blur-3xl opacity-60" />

      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl z-10 flex flex-col items-center">
        
        <AnimatePresence>
          {step === 'idle' && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center mb-10 md:mb-14"
            >
              <div className="flex items-center justify-center gap-3 mb-5">                
                  <img src="/assets/logo.svg" alt="Capim Tecnologia"  />                
              </div>
              <p className="text-neutral-600 text-lg md:text-xl max-w-xl mx-auto font-medium">
                Avalie o perfil do Instagram da sua clínica.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full">
          <AnimatePresence mode="wait">
            {step === 'idle' && (
              <ScannerForm onScan={handleStartScan} key="scanner" />
            )}
            {step === 'scanning' && (
              <LoadingOverlay 
                onComplete={handleScanComplete} 
                key="loader" 
                handle={handle}
              />
            )}
            {step === 'results' && result && (
              <ResultsDashboard 
                result={result} 
                onReset={handleReset} 
                key="results" 
              />
            )}
          </AnimatePresence>
        </div>
      </div>
      
     
    </main>
  );
}