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
  const [scanError, setScanError] = useState<string>('');

  const handleStartScan = async (handle: string) => {
    setHandle(handle);
    setScanError('');
    setStep('scanning');
  };

  const handleScanError = (message: string) => {
    setScanError(message);
    setStep('idle');
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
    <main className="min-h-screen flex flex-col items-center justify-center text-neutral-900 relative overflow-hidden px-6 py-4">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-capim-400 via-capim-600 to-capim-800 z-50" />
      
      <AnimatePresence>
        {step === 'idle' && (
          <motion.img 
            key="bg-image"
            src="/assets/toten.png" 
            alt="Background" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" 
          />
        )}
      </AnimatePresence>

      <div className="w-full max-w-md md:max-w-2xl lg:max-w-5xl z-10 flex flex-col items-center">
        
        <div className="w-full">
          <AnimatePresence mode="wait">
            {step === 'idle' && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="relative w-full flex items-center justify-center h-[95vh]"
              >
                <div className="relative z-5 w-full flex flex-col justify-center items-center h-full pt-40">
                  <ScannerForm onScan={handleStartScan} errorMessage={scanError} />
                  
                  <div className="absolute bottom-20 text-center">
                    <p className="text-3xl md:text-4xl text-capim-500 font-light drop-shadow-sm font-roboto">
                      Descubra o <span className="font-bold">potencial</span> do seu <span className="font-bold">Instagram</span> com a <span className="font-bold">Camila!</span> 
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            {step === 'scanning' && (
              <LoadingOverlay 
                onComplete={handleScanComplete} 
                onError={handleScanError}
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