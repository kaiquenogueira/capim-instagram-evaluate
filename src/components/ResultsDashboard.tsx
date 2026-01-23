'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, Award, TrendingUp, Users, Grid, UserCheck, Heart, MessageCircle, Star, Sparkles, Repeat, Fingerprint, Send, CheckCircle, Smartphone, Lock, ChevronRight } from 'lucide-react';
import { AnalysisResult } from '@/types';
import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { sendWhatsAppWithAttachment } from '@/actions/sendWhatsApp';

interface ResultsDashboardProps {
  result: AnalysisResult;
  onReset: () => void;
}

const CircularProgress = ({ value, color, size = 100, strokeWidth = 8 }: { value: number, color: string, size?: number, strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E9E9F2"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle 
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-neutral-800">{value}</span>
      </div>
    </div>
  );
};



export default function ResultsDashboard({ result, onReset }: ResultsDashboardProps) {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [activeMetricId, setActiveMetricId] = useState<string>('quality');

  const getMetricDescription = (id: string, score: number) => {
    // 1. Tentar usar explicação dinâmica da IA (se disponível)
    if (result.metricExplanations) {
      const key = id as keyof typeof result.metricExplanations;
      if (result.metricExplanations[key]) {
        return result.metricExplanations[key];
      }
    }

    // 2. Fallback para descrições estáticas
    if (score >= 80) {
      switch (id) {
        case 'quality':
          return "Sua nota é alta pois o perfil transmite excelente autoridade visual, com imagens de alta resolução e forte presença de prova social e resultados.";
        case 'consistency':
          return "Excelente pontuação! Sua frequência de postagens é consistente, o que é fundamental para manter o algoritmo trabalhando a seu favor.";
        case 'branding':
          return "Seu branding está muito bem definido. A identidade visual e a bio comunicam claramente sua especialidade e posicionamento para o público.";
        case 'interaction':
          return "Nota alta em interação! Você utiliza CTAs (chamadas para ação) eficientes e links estratégicos que incentivam o engajamento e a conversão.";
        default:
          return "Excelente desempenho nesta métrica.";
      }
    } else if (score >= 50) {
      switch (id) {
        case 'quality':
          return "Sua nota indica uma boa qualidade visual, mas há espaço para reforçar a autoridade com mais depoimentos e resultados visíveis no feed.";
        case 'consistency':
          return "Sua frequência é razoável, mas pode oscilar. Para aumentar essa nota, tente manter uma rotina de postagens mais rigorosa e previsível.";
        case 'branding':
          return "Seu posicionamento é compreensível, mas pode ser mais afiado. Refinar a bio e padronizar os destaques ajudaria a elevar essa nota.";
        case 'interaction':
          return "Você tem um bom potencial de engajamento, mas poderia ser mais intencional nos CTAs para transformar seguidores em pacientes de forma mais efetiva.";
        default:
          return "Bom desempenho, com oportunidades de melhoria.";
      }
    } else {
      switch (id) {
        case 'quality':
          return "A nota reflete a necessidade de melhorar a percepção de autoridade. Imagens de baixa resolução ou falta de prova social impactam negativamente.";
        case 'consistency':
          return "Sua pontuação foi impactada pela baixa frequência de postagens. O Instagram penaliza perfis inativos, dificultando o crescimento.";
        case 'branding':
          return "O branding precisa de atenção. A nota indica que visitantes podem ter dificuldade de entender rapidamente sua especialidade e diferenciais.";
        case 'interaction':
          return "A nota está baixa pois faltam estímulos claros para interação. Sem CTAs fortes e links acessíveis, você perde oportunidades de conversão.";
        default:
          return "Esta área precisa de atenção prioritária.";
      }
    }
  };

  const metricsData = [
    {
      id: 'quality',
      title: 'Qualidade e Autoridade',
      icon: Sparkles,
      color: { hex: '#9333ea', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', ring: 'ring-purple-500' },
      score: result.metrics?.quality ?? 0,
      description: getMetricDescription('quality', result.metrics?.quality ?? 0),
      criteria: [
        { label: "Prova Social", value: result.detailedMetrics?.criteria?.socialProof ?? 0 },
        { label: "Resultados Visíveis", value: result.detailedMetrics?.criteria?.resultsProof ?? 0 }
      ]
    },
    {
      id: 'consistency',
      title: 'Consistência e Frequência',
      icon: Repeat,
      color: { hex: '#3DE4F5', bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200', ring: 'ring-cyan-500' },
      score: result.metrics?.consistency ?? 0,
      description: getMetricDescription('consistency', result.metrics?.consistency ?? 0),
      criteria: [
        { label: "Frequência de Postagem", value: result.detailedMetrics?.criteria?.frequency ?? 0 }
      ]
    },
    {
      id: 'branding',
      title: 'Branding e Posicionamento',
      icon: Fingerprint,
      color: { hex: '#E94A4A', bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', ring: 'ring-pink-500' },
      score: result.metrics?.branding ?? 0,
      description: getMetricDescription('branding', result.metrics?.branding ?? 0),
      criteria: [
        { label: "Clareza de Posicionamento", value: result.detailedMetrics?.criteria?.positioningClarity ?? 0 }
      ]
    },
    {
      id: 'interaction',
      title: 'Interação e Engajamento',
      icon: MessageCircle,
      color: { hex: '#F1AF0F', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', ring: 'ring-orange-500' },
      score: result.metrics?.interaction ?? 0,
      description: getMetricDescription('interaction', result.metrics?.interaction ?? 0),
      criteria: [
        { label: "Links e CTA", value: result.detailedMetrics?.criteria?.ctaAndLinks ?? 0 }
      ]
    }
  ];

  const activeMetric = metricsData.find(m => m.id === activeMetricId) || metricsData[0];
  
  const [phone, setPhone] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    // Mask logic
    if (value.length > 10) {
      // (XX) XXXXX-XXXX
      value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (value.length > 5) {
      // (XX) XXXX-XXXX (Partial or Full 10 digit)
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (value.length > 2) {
      // (XX) ...
      value = value.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
    }
    
    setPhone(value);
  };

  const handleSendWhatsApp = async () => {
    // Validation for:
    // (XX) XXXX-XXXX (14 chars)
    // (XX) XXXXX-XXXX (15 chars)
    if (!phone || phone.length < 14) return; 
    
    setIsSending(true);
    
    try {
      if (dashboardRef.current) {
        // Wait for any animations
        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(dashboardRef.current, {
          useCORS: true,
          scale: 1, // Reduced scale to avoid huge file sizes
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
          windowWidth: 1200, // Force desktop width
          ignoreElements: (element) => {
              return element.hasAttribute('data-html2canvas-ignore');
          },
          onclone: (clonedDoc) => {
            const element = clonedDoc.getElementById('dashboard-content');
            if (element) {
               element.style.transform = 'none';
               element.style.width = '1200px';
               element.style.maxWidth = '1200px';
               element.style.margin = '0';
               element.style.borderRadius = '0';
               element.style.border = 'none';
               element.style.boxShadow = 'none';
               
               // Fix Header Alignment in PDF
               const header = element.querySelector('.bg-gradient-to-r');
               if (header instanceof HTMLElement) {
                  header.style.paddingRight = '40px';
                  header.style.display = 'flex';
                  header.style.justifyContent = 'space-between';
               }

               // Fix Ranking Indicator overlap
               const scoreContainer = element.querySelector('.flex.flex-col.items-end');
               if (scoreContainer instanceof HTMLElement) {
                  scoreContainer.style.minWidth = '180px';
                  scoreContainer.style.display = 'flex';
                  scoreContainer.style.flexDirection = 'column';
                  scoreContainer.style.alignItems = 'flex-end';
               }
            }

            // Unblur restricted section for PDF
            const restrictedSection = clonedDoc.getElementById('restricted-section');
            if (restrictedSection) {
                restrictedSection.style.filter = 'none';
                restrictedSection.style.pointerEvents = 'auto';
                restrictedSection.style.userSelect = 'auto';
            }
          }
        });
        
        // Use JPEG with quality 0.8
        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
        
        const pdfBlob = pdf.output('blob');
        const sizeInMB = (pdfBlob.size / 1024 / 1024).toFixed(2);
        console.log(`PDF Generated. Size: ${sizeInMB} MB`);

        if (pdfBlob.size > 9 * 1024 * 1024) {
           console.warn('PDF size is close to or exceeds 10MB limit.');
        }
        
        const formData = new FormData();
        formData.append('file', pdfBlob, `relatorio-capim-${result.handle}.pdf`);
        formData.append('phone', phone); 
        formData.append('perfil', result.handle);
        
        const response = await sendWhatsAppWithAttachment(formData);
        
        if (!response.success) {
           console.error('Falha no envio:', response.message);
        } else {
           setSentSuccess(true);
           setIsUnlocked(true);
           setTimeout(() => setSentSuccess(false), 5000);
           setPhone('');
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsSending(false);
    }
  };

  const averageScore = Math.round(
    ((result.metrics?.quality ?? 0) + (result.metrics?.consistency ?? 0) + (result.metrics?.branding ?? 0) + (result.metrics?.interaction ?? 0)) / 4
  );

  const formatNumber = (num?: number) => {
    if (num === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', { notation: "compact", maximumFractionDigits: 1 }).format(num);
  };

  const RankingIndicator = ({ value, average, suffix = "" }: { value: number, average: number, suffix?: string }) => {
    const isAboveAverage = value >= average;
    
    if (isAboveAverage) {
      return (
        <div className="flex items-center gap-1 mt-1.5 text-xs font-bold text-lime-600 bg-lime-50 px-2.5 py-1 rounded-full border border-lime-100/50 shadow-sm">
           <Star size={10} className="fill-lime-600" />
           <span>Acima da média{suffix}</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-1 mt-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100/50">
         <TrendingUp size={10} />
         <span>Oportunidade</span>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-7xl mx-auto"
    >
      <div 
        ref={dashboardRef}
        id="dashboard-content"
        className="bg-white rounded-3xl shadow-xl overflow-hidden border border-neutral-200/60"
      >
        
        {/* Header com Perfil */}
        <div className="bg-gradient-to-r from-capim-50 via-white to-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-neutral-200/60">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">@{result.handle}</h2>
              <p className="text-neutral-600 font-medium">Relatório de Performance</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
               <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Score Geral</span>
               <span className="text-5xl font-black text-capim-600">{averageScore}</span>
               {result.ranking && (
                 <RankingIndicator value={averageScore} average={result.ranking.avgOverallScore} />
               )}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        {result.stats && (
          <div className="grid grid-cols-3 divide-x divide-neutral-100 border-b border-neutral-100 bg-neutral-50/50">
            <div className="p-4 flex flex-col items-center justify-center hover:bg-neutral-50 transition-colors">
              <div className="flex items-center gap-2 text-neutral-500 mb-1">
                <Users size={18} />
                <span className="text-sm font-medium">Seguidores</span>
              </div>
              <span className="text-xl font-bold text-neutral-800">{formatNumber(result.stats.followers)}</span>
              {result.ranking && (
                <RankingIndicator value={result.stats.followers} average={result.ranking.avgFollowers} />
              )}
            </div>
            <div className="p-4 flex flex-col items-center justify-center hover:bg-neutral-50 transition-colors">
              <div className="flex items-center gap-2 text-neutral-500 mb-1">
                <UserCheck size={18} />
                <span className="text-sm font-medium">Seguindo</span>
              </div>
              <span className="text-xl font-bold text-neutral-800">{formatNumber(result.stats.following)}</span>
            </div>
            <div className="p-4 flex flex-col items-center justify-center hover:bg-neutral-50 transition-colors">
              <div className="flex items-center gap-2 text-neutral-500 mb-1">
                <Grid size={18} />
                <span className="text-sm font-medium">Posts</span>
              </div>
              <span className="text-xl font-bold text-neutral-800">{formatNumber(result.stats.posts)}</span>
              {result.ranking && (
                <RankingIndicator value={result.stats.posts} average={result.ranking.avgPosts} />
              )}
            </div>
          </div>
        )}

        {/* 1. Resumo da Análise */}
        <div className="p-6 md:p-8 border-b border-neutral-200/60 bg-white">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Award size={20} className="text-capim-600" />
            Resumo da Análise
          </h3>
          <p className="text-neutral-700 leading-relaxed text-lg bg-capim-50/50 p-6 rounded-2xl border border-capim-100">
            {result.summary}
          </p>
        </div>

        {/* 2. WhatsApp Section (Replaces Email Share) */}
        <div className="p-6 md:p-8 border-b border-neutral-200/60 bg-neutral-50" data-html2canvas-ignore="true">
           <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="flex-1">
                 <h3 className="text-lg font-bold text-neutral-900 mb-2 flex items-center gap-2">
                    <MessageCircle className="text-green-600" size={24} />
                    Receba este relatório no WhatsApp
                 </h3>
                 <p className="text-neutral-600 text-sm">
                    Digite seu número para receber o PDF completo com a análise detalhada.
                 </p>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                 {sentSuccess ? (
                    <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-4 py-3 rounded-xl border border-green-100">
                        <CheckCircle size={20} />
                        <span>Enviado com sucesso!</span>
                    </div>
                 ) : (
                    <>
                        <input 
                            type="tel" 
                            value={phone}
                            onChange={handlePhoneChange}
                            placeholder="(11) 99999-9999"
                            className="flex-1 md:w-48 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-capim-500 focus:border-transparent outline-none transition-all text-neutral-900 font-medium placeholder:text-neutral-400"
                        />
                        <button 
                            onClick={handleSendWhatsApp}
                            disabled={isSending || phone.length < 14}
                            className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                        >
                            {isSending ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Enviando...
                                </span> 
                            ) : (
                                <>
                                    <Send size={18} />
                                    <span>Enviar</span>
                                </>
                            )}
                        </button>
                    </>
                 )}
              </div>
           </div>
        </div>

        {/* WRAPPER FOR RESTRICTED CONTENT */}
        <div className="relative">
          <div 
            id="restricted-section" 
            className={`transition-all duration-1000 ease-in-out ${!isUnlocked ? 'filter blur-md select-none pointer-events-none opacity-50' : ''}`}
          >
            {/* 3. Análise Visual dos Últimos Posts (Moved Up) */}
            {result.postsAnalysis && result.postsAnalysis.length > 0 && (
              <div className="p-6 md:p-8 border-b border-neutral-200/60 bg-neutral-50/30">
                <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2 mb-6">
                    <Grid size={24} className="text-capim-600" />
                    Análise Visual dos Últimos Posts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {result.postsAnalysis.map((post, idx) => (
                    <div 
                        key={idx} 
                        className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-200 flex flex-col hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-square relative bg-neutral-100 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.imageUrl} alt={`Post ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white">
                          <div className="flex gap-4 text-sm font-medium">
                            <span className="flex items-center gap-1.5"><Heart size={16} className="fill-white/20" /> {formatNumber(post.likes)}</span>
                            <span className="flex items-center gap-1.5"><MessageCircle size={16} className="fill-white/20" /> {formatNumber(post.comments)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="mb-3 pb-3 border-b border-neutral-100">
                            <p className="text-xs text-neutral-500 line-clamp-2 italic leading-relaxed">"{post.caption}"</p>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-neutral-700 leading-relaxed font-medium">
                                <span className="text-capim-600 font-bold mr-1">Análise IA:</span>
                                {post.analysis}
                            </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Métricas do Perfil (Unified) */}
            <div className="p-6 md:p-8 border-b border-neutral-200/60 bg-white">
              <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2 mb-6">
                <TrendingUp size={24} className="text-capim-600" />
                Métricas do Perfil
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Metrics List */}
                <div className="lg:col-span-1 flex flex-col gap-3">
                  {metricsData.map((metric) => (
                    <button
                      key={metric.id}
                      onClick={() => setActiveMetricId(metric.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 group text-left ${
                        activeMetricId === metric.id
                          ? `bg-white ${metric.color.border} ${metric.color.ring} ring-1 shadow-sm`
                          : 'bg-neutral-50 border-transparent hover:bg-white hover:border-neutral-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${metric.color.bg} ${metric.color.text}`}>
                          <metric.icon size={18} />
                        </div>
                        <div>
                          <span className={`block text-sm font-semibold ${activeMetricId === metric.id ? 'text-neutral-900' : 'text-neutral-600 group-hover:text-neutral-900'}`}>
                            {metric.title}
                          </span>
                          <span className="text-xs text-neutral-500 font-medium">
                            Nota: <span className={metric.color.text}>{metric.score}</span>
                          </span>
                        </div>
                      </div>
                      <ChevronRight 
                        size={16} 
                        className={`transition-transform duration-200 ${
                          activeMetricId === metric.id 
                            ? `text-neutral-400`
                            : 'text-neutral-300 group-hover:text-neutral-400'
                        }`} 
                      />
                    </button>
                  ))}
                </div>

                {/* Right Column: Detail View */}
                <div className="lg:col-span-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeMetric.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className={`h-full bg-white rounded-2xl border ${activeMetric.color.border} p-6 md:p-8 relative overflow-hidden`}
                    >
                      {/* Background Decor */}
                      <div className={`absolute top-0 right-0 w-64 h-64 ${activeMetric.color.bg} rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/3 pointer-events-none`} />

                      <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                        {/* Score Circle */}
                        <div className="flex-shrink-0 mx-auto md:mx-0">
                           <CircularProgress 
                              value={activeMetric.score} 
                              color={activeMetric.color.hex} 
                              size={140} 
                              strokeWidth={10} 
                           />
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-6">
                          <div>
                            <h4 className="text-2xl font-bold text-neutral-900 mb-2 flex items-center gap-2">
                              <activeMetric.icon className={activeMetric.color.text} size={24} />
                              {activeMetric.title}
                            </h4>
                            <p className="text-neutral-600 leading-relaxed">
                              {activeMetric.description}
                            </p>
                          </div>

                          {/* Criteria List */}
                          <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-100">
                            <h5 className="text-sm font-semibold text-neutral-800 mb-4 uppercase tracking-wider">
                              Fatores Analisados
                            </h5>
                            <div className="space-y-4">
                              {activeMetric.criteria.map((criterion, idx) => (
                                <div key={idx}>
                                  <div className="flex justify-between text-sm font-medium mb-1.5">
                                    <span className="text-neutral-700">{criterion.label}</span>
                                    <span className="text-neutral-900 font-bold">{criterion.value}/100</span>
                                  </div>
                                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${criterion.value}%` }}
                                      transition={{ duration: 1, delay: 0.1 * idx }}
                                      className={`h-full rounded-full`}
                                      style={{ backgroundColor: activeMetric.color.hex }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* 5. Análise de Bio e Conversão (Moved) */}
            {result.bioAnalysis && (
              <div className="p-6 md:p-8 border-b border-neutral-200/60">
                 <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2 mb-6">
                    <UserCheck size={24} className="text-capim-600" />
                    Análise de Bio e Conversão
                 </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-neutral-700">Clareza da Proposta</span>
                            {result.ranking?.bioRanking && (
                              <RankingIndicator 
                                value={result.bioAnalysis.clarity} 
                                average={result.ranking.bioRanking.clarity.average} 
                              />
                            )}
                          </div>
                          <span className="text-sm font-semibold text-neutral-700">{result.bioAnalysis.clarity}/100</span>
                        </div>
                        <div className="h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${result.bioAnalysis.clarity}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-capim-500 rounded-full" 
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-neutral-700">Otimização para Conversão</span>
                            {result.ranking?.bioRanking && (
                              <RankingIndicator 
                                value={result.bioAnalysis.cro} 
                                average={result.ranking.bioRanking.cro.average} 
                              />
                            )}
                          </div>
                          <span className="text-sm font-semibold text-neutral-700">{result.bioAnalysis.cro}/100</span>
                        </div>
                        <div className="h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${result.bioAnalysis.cro}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                            className="h-full bg-capim-500 rounded-full" 
                          />
                        </div>
                      </div>
                      <div className="pt-2">
                        <span className="text-sm text-neutral-500 block mb-2 font-medium">Tom de Voz Identificado</span>
                        <span className="inline-block px-4 py-1.5 bg-white border border-neutral-200 rounded-full text-sm font-semibold text-neutral-700 shadow-sm">
                          {result.bioAnalysis.tone}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                    <h4 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-capim-600" />
                        Sugestões de Melhoria
                    </h4>
                    <ul className="space-y-3">
                      {result.bioAnalysis.suggestions?.map((sug, i) => (
                        <li key={i} className="flex gap-3 text-sm text-neutral-600 items-start">
                          <span className="text-capim-500 font-bold mt-0.5">•</span>
                          <span className="leading-relaxed">{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Dicas para crescer (Moved) */}
            {result.tips && result.tips.length > 0 && (
              <div className="p-6 md:p-8 bg-white">
                <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2 mb-6">
                    <TrendingUp size={24} className="text-capim-600" />
                    Dicas para crescer
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {result.tips.map((tip, idx) => (
                      <li key={idx} className="flex gap-3 items-start bg-neutral-50 p-5 rounded-xl border border-neutral-100 hover:border-capim-200 transition-colors">
                        <div className="min-w-[32px] h-8 bg-capim-100 text-capim-700 rounded-full flex items-center justify-center text-sm font-bold mt-0.5 border border-capim-200/70 shadow-sm">
                          {idx + 1}
                        </div>
                        <p className="text-neutral-700 text-base leading-relaxed">{tip}</p>
                      </li>
                   ))}
                </ul>
              </div>
            )}

            <div className="p-8 bg-neutral-50 border-t border-neutral-200/60 flex flex-col items-center gap-6">
              <button
                onClick={onReset}
                className="flex items-center gap-2 px-8 py-3 bg-white border border-neutral-300 text-neutral-800 font-semibold rounded-2xl hover:bg-neutral-50 hover:border-capim-400 hover:text-capim-600 transition-all shadow-sm"
              >
                <RefreshCcw size={18} />
                Nova Análise
              </button>

              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Powered by</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/logo.svg" alt="Capim" className="h-5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all" />
              </div>
            </div>
          </div>

          {!isUnlocked && (
             <div className="absolute inset-0 z-10 flex items-start justify-center pt-24 bg-gradient-to-b from-white/10 to-white/60" data-html2canvas-ignore="true">
                 <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 max-w-md text-center mx-4 mt-8">
                     <div className="w-16 h-16 bg-capim-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Lock className="w-8 h-8 text-capim-600" />
                     </div>
                     <h3 className="text-2xl font-bold text-neutral-900 mb-3 tracking-tight">Desbloqueie sua Análise Completa</h3>
                     <p className="text-neutral-600 mb-8 leading-relaxed">
                         Para acessar o relatório detalhado com métricas visuais, análise de bio e dicas de crescimento, basta confirmar seu WhatsApp acima.
                     </p>
                     <div className="flex flex-col gap-3 text-sm text-neutral-500 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-capim-500" />
                            <span>Métricas Visuais Detalhadas</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-capim-500" />
                            <span>Checklist de Qualidade</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-capim-500" />
                            <span>Análise de Conversão da Bio</span>
                        </div>
                     </div>
                 </div>
             </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
