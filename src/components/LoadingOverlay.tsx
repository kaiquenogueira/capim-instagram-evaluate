'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scan, Database, Palette, Users, Sparkles } from 'lucide-react';
import { analyzeProfile } from '@/actions/analyze';
import { AnalysisResult } from '@/types';

interface LoadingOverlayProps {
  onComplete: (data: AnalysisResult) => void;
  handle?: string;
}

const steps = [
  { id: 1, text: "Conectando ao perfil...", icon: Scan },
  { id: 2, text: "Buscando dados...", icon: Database },
  { id: 3, text: "Analisando identidade visual...", icon: Palette },
  { id: 4, text: "Calculando métricas de engajamento...", icon: Users },
  { id: 5, text: "Gerando insights com IA...", icon: Sparkles },
];

export default function LoadingOverlay({ onComplete, handle = "clinica" }: LoadingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnalysisDone, setIsAnalysisDone] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const performAnalysis = async () => {
      try {
        const data = await analyzeProfile(handle);
        setAnalysisData(data);
        setIsAnalysisDone(true);
      } catch (error) {
        console.error(error);
        setIsAnalysisDone(true); 
      }
    };

    performAnalysis();
  }, [handle]);

  useEffect(() => {
    if (currentStep < steps.length - 1) {
      const timeout = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timeout);
    } else {
      if (isAnalysisDone && analysisData) {
        setTimeout(() => {
          onComplete(analysisData);
        }, 1000);
      }
    }
  }, [currentStep, isAnalysisDone, analysisData, onComplete]);

  useEffect(() => {
    if (isAnalysisDone && analysisData && currentStep === steps.length - 1) {
       const timeout = setTimeout(() => {
          onComplete(analysisData);
       }, 1000);
       return () => clearTimeout(timeout);
    }
  }, [isAnalysisDone, analysisData, currentStep, onComplete]);

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md">
      <div className="relative flex flex-col items-center">
        
        <div className="relative w-64 h-64 mb-8 flex items-center justify-center">
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-capim-100 rounded-full blur-xl"
          />
          
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute w-full h-full border border-capim-200/70 rounded-full"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-capim-500 rounded-full shadow-lg shadow-capim-500/40" />
          </motion.div>

          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute w-48 h-48 border border-capim-300/70 rounded-full border-dashed"
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-capim-400 rounded-full shadow-lg shadow-capim-400/40" />
          </motion.div>

          <div className="relative z-10 w-24 h-24 bg-white rounded-full shadow-2xl flex items-center justify-center text-capim-600">
             <motion.div
                key={currentStep}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
             >
                <CurrentIcon size={40} />
             </motion.div>
          </div>
        </div>

        <div className="h-16 flex flex-col items-center justify-center">
            <motion.h2 
                key={steps[currentStep].text}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="text-xl font-semibold text-neutral-800 text-center"
            >
                {steps[currentStep].text}
            </motion.h2>
            <div className="flex gap-2 mt-4">
                {steps.map((step, idx) => (
                    <div 
                        key={step.id} 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                            idx <= currentStep ? 'w-8 bg-capim-600' : 'w-2 bg-neutral-200'
                        }`}
                    />
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}