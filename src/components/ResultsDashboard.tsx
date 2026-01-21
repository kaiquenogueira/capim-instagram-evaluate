'use client';

import { motion } from 'framer-motion';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { RefreshCcw, Share2, Award, TrendingUp, Users, Grid, UserCheck, Heart, MessageCircle, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { AnalysisResult } from '@/types';
import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ShareModal from './ShareModal';
import { sendEmailWithAttachment } from '@/actions/sendEmail';

interface ResultsDashboardProps {
  result: AnalysisResult;
  onReset: () => void;
}

const CollapsibleSection = ({ 
  title, 
  icon: Icon, 
  children, 
  className = "",
  defaultOpen = false,
  forceOpen = false
}: { 
  title: string, 
  icon: React.ElementType, 
  children: React.ReactNode, 
  className?: string,
  defaultOpen?: boolean,
  forceOpen?: boolean
}) => {
  const [localIsOpen, setLocalIsOpen] = useState(defaultOpen);
  const isOpen = forceOpen || localIsOpen;

  return (
    <div className={`border-t border-slate-200/60 ${className}`}>
      <button 
        onClick={() => setLocalIsOpen(!localIsOpen)}
        className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-slate-50/50 transition-colors text-left"
      >
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Icon size={24} className="text-capim-600" />
          {title}
        </h3>
        {isOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
      </button>
      
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="px-6 md:px-8 pb-6 md:pb-8">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default function ResultsDashboard({ result, onReset }: ResultsDashboardProps) {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleSendEmail = async (email: string) => {
    setIsSending(true);
    setIsGeneratingPdf(true); // Force expand all sections
    
    try {
      if (dashboardRef.current) {
        // Wait for animations to complete
        await new Promise(resolve => setTimeout(resolve, 800));

        const canvas = await html2canvas(dashboardRef.current, {
          useCORS: true,
          scale: 1, // Reduced scale to avoid huge file sizes
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
          windowWidth: 1200, // Force desktop width to prevent layout shifts
          onclone: (clonedDoc) => {
            // Ensure the cloned element is visible and has correct styles
            const element = clonedDoc.getElementById('dashboard-content');
            if (element) {
               element.style.transform = 'none';
               // Force width to ensure consistent rendering
               element.style.width = '1200px';
               element.style.margin = '0 auto';
            }
          }
        });
        
        // Use JPEG with quality 0.8 instead of PNG to reduce size drastically
        const imgData = canvas.toDataURL('image/jpeg', 1);
        
        // Calculate PDF dimensions to fit A4 or keep original aspect ratio
        // For long dashboards, it's better to keep original ratio or split pages
        // Here we'll create a single long page PDF for better viewing experience
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
        
        // Generate Blob
        const pdfBlob = pdf.output('blob');
        const sizeInMB = (pdfBlob.size / 1024 / 1024).toFixed(2);
        console.log(`PDF Generated. Size: ${sizeInMB} MB`);

        if (pdfBlob.size > 9 * 1024 * 1024) {
           console.warn('PDF size is close to or exceeds 10MB limit. Consider reducing quality further.');
        }
        
        // Prepare FormData
        const formData = new FormData();
        formData.append('file', pdfBlob, `relatorio-capim-${result.handle}.pdf`);
        formData.append('email', email);
        
        // Call Server Action
        const response = await sendEmailWithAttachment(formData);
        
        if (!response.success) {
           console.error('Falha no envio:', response.message);
           // You might want to show an error toast here
           // For now, we just log it.
        } else {
           console.log('E-mail enviado com sucesso!');
        }
        
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsSending(false);
      setIsGeneratingPdf(false);
    }
  };

  const chartData = [
    { subject: 'Qualidade', A: result.metrics?.quality ?? 0, fullMark: 100 },
    { subject: 'Consistência', A: result.metrics?.consistency ?? 0, fullMark: 100 },
    { subject: 'Branding', A: result.metrics?.branding ?? 0, fullMark: 100 },
    { subject: 'Interação', A: result.metrics?.interaction ?? 0, fullMark: 100 },
  ];

  const averageScore = Math.round(
    ((result.metrics?.quality ?? 0) + (result.metrics?.consistency ?? 0) + (result.metrics?.branding ?? 0) + (result.metrics?.interaction ?? 0)) / 4
  );

  const formatNumber = (num?: number) => {
    if (num === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', { notation: "compact", maximumFractionDigits: 1 }).format(num);
  };

  const RankingIndicator = ({ value, average, suffix = "" }: { value: number, average: number, suffix?: string }) => {
    const isAboveAverage = value > average;
    
    if (isAboveAverage) {
      return (
        <div className="flex items-center gap-1 mt-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/50 shadow-sm">
           <Star size={10} className="fill-emerald-600" />
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
        className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/60"
      >
        
        {/* Header com Perfil */}
        <div className="bg-gradient-to-r from-capim-50 via-white to-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-200/60">
          <div className="flex items-center gap-6">
      
            
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">@{result.handle}</h2>
              <p className="text-slate-600 font-medium">Relatório de Performance</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
               <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Score Geral</span>
               <span className="text-5xl font-black text-capim-600">{averageScore}</span>
               {result.ranking && (
                 <RankingIndicator value={averageScore} average={result.ranking.avgOverallScore} />
               )}
            </div>
            <div className="w-px h-16 bg-slate-200 hidden md:block"></div>
            <button 
              onClick={handleShare}
              className="p-3 text-slate-400 hover:text-capim-600 hover:bg-capim-50 rounded-full transition-all"
            >
               <Share2 size={24} />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        {result.stats && (
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
            <div className="p-4 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Users size={18} />
                <span className="text-sm font-medium">Seguidores</span>
              </div>
              <span className="text-xl font-bold text-slate-800">{formatNumber(result.stats.followers)}</span>
              {result.ranking && (
                <RankingIndicator value={result.stats.followers} average={result.ranking.avgFollowers} />
              )}
            </div>
            <div className="p-4 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <UserCheck size={18} />
                <span className="text-sm font-medium">Seguindo</span>
              </div>
              <span className="text-xl font-bold text-slate-800">{formatNumber(result.stats.following)}</span>
            </div>
            <div className="p-4 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Grid size={18} />
                <span className="text-sm font-medium">Posts</span>
              </div>
              <span className="text-xl font-bold text-slate-800">{formatNumber(result.stats.posts)}</span>
              {result.ranking && (
                <RankingIndicator value={result.stats.posts} average={result.ranking.avgPosts} />
              )}
            </div>
          </div>
        )}

        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          
          <div className="flex flex-col items-center justify-center min-h-[500px] bg-slate-50 rounded-2xl p-6 border border-slate-200/60">
            <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
              <TrendingUp size={40} className="text-capim-600" />
              Métricas do Perfil
            </h3>
            <div className="w-full h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 13, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Performance"
                    dataKey="A"
                    stroke="#32205F"
                    strokeWidth={3}
                    fill="#8B5CF6"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <Award size={20} className="text-capim-600" />
                Resumo da IA
              </h3>
              <p className="text-slate-700 leading-relaxed bg-capim-50 p-4 rounded-2xl border border-capim-100">
                {result.summary}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">
                Dicas para crescer
              </h3>
              <ul className="space-y-3">
                {result.tips?.map((tip, idx) => (
                  <li key={idx} className="flex gap-3 items-start">
                    <div className="min-w-[28px] h-7 bg-capim-100 text-capim-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 border border-capim-200/70">
                      {idx + 1}
                    </div>
                    <p className="text-slate-700 text-sm">{tip}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Checklist */}
        {result.detailedMetrics && (
          <CollapsibleSection 
            title="Checklist de Qualidade do Perfil" 
            icon={Award} 
            className="bg-white"
            forceOpen={isGeneratingPdf}
          >
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
               <div className="space-y-6">
                  {/* Item 1 */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2 text-slate-700">
                      <span>Frequência e Constância</span>
                      <span className="text-slate-900">{result.detailedMetrics.criteria.frequency}/100</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.detailedMetrics.criteria.frequency}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${result.detailedMetrics.criteria.frequency >= 70 ? 'bg-emerald-500' : result.detailedMetrics.criteria.frequency >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} 
                      />
                    </div>
                  </div>
                   {/* Item 2 */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2 text-slate-700">
                      <span>Links e CTA (WhatsApp/Agendamento)</span>
                      <span className="text-slate-900">{result.detailedMetrics.criteria.ctaAndLinks}/100</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.detailedMetrics.criteria.ctaAndLinks}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                        className={`h-full rounded-full ${result.detailedMetrics.criteria.ctaAndLinks >= 70 ? 'bg-emerald-500' : result.detailedMetrics.criteria.ctaAndLinks >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} 
                      />
                    </div>
                  </div>
                   {/* Item 3 */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2 text-slate-700">
                      <span>Clareza de Posicionamento</span>
                      <span className="text-slate-900">{result.detailedMetrics.criteria.positioningClarity}/100</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.detailedMetrics.criteria.positioningClarity}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                        className={`h-full rounded-full ${result.detailedMetrics.criteria.positioningClarity >= 70 ? 'bg-emerald-500' : result.detailedMetrics.criteria.positioningClarity >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} 
                      />
                    </div>
                  </div>
               </div>
               <div className="space-y-6">
                   {/* Item 4 */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2 text-slate-700">
                      <span>Prova Social (Depoimentos)</span>
                      <span className="text-slate-900">{result.detailedMetrics.criteria.socialProof}/100</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.detailedMetrics.criteria.socialProof}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                        className={`h-full rounded-full ${result.detailedMetrics.criteria.socialProof >= 70 ? 'bg-emerald-500' : result.detailedMetrics.criteria.socialProof >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} 
                      />
                    </div>
                  </div>
                  
               </div>
             </div>
          </CollapsibleSection>
        )}

        {/* Bio Analysis Section */}
        {result.bioAnalysis && (
          <CollapsibleSection
            title="Análise de Bio e Conversão"
            icon={UserCheck}
            forceOpen={isGeneratingPdf}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2 text-slate-700">
                      <span>Clareza da Proposta</span>
                      <span>{result.bioAnalysis.clarity}/100</span>
                    </div>
                    <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.bioAnalysis.clarity}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-capim-500 rounded-full" 
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2 text-slate-700">
                      <span>Otimização para Conversão  </span>
                      <span>{result.bioAnalysis.cro}/100</span>
                    </div>
                    <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.bioAnalysis.cro}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                        className="h-full bg-capim-500 rounded-full" 
                      />
                    </div>
                  </div>
                  <div className="pt-2">
                    <span className="text-sm text-slate-500 block mb-2 font-medium">Tom de Voz Identificado</span>
                    <span className="inline-block px-4 py-1.5 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-700 shadow-sm">
                      {result.bioAnalysis.tone}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-capim-600" />
                    Sugestões de Melhoria
                </h4>
                <ul className="space-y-3">
                  {result.bioAnalysis.suggestions?.map((sug, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-600 items-start">
                      <span className="text-capim-500 font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* Posts Analysis Section */}
        {result.postsAnalysis && result.postsAnalysis.length > 0 && (
          <CollapsibleSection
            title="Análise Visual dos Últimos Posts"
            icon={Grid}
            className="bg-slate-50/30"
            forceOpen={isGeneratingPdf}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {result.postsAnalysis.map((post, idx) => (
                <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 + 0.3 }}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 flex flex-col hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square relative bg-slate-100 group">
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
                    <div className="mb-3 pb-3 border-b border-slate-100">
                        <p className="text-xs text-slate-500 line-clamp-2 italic leading-relaxed">"{post.caption}"</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                            <span className="text-capim-600 font-bold mr-1">Análise IA:</span>
                            {post.analysis}
                        </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        <div className="p-6 bg-slate-50 border-t border-slate-200/60 flex justify-center">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-8 py-3 bg-white border border-slate-300 text-slate-800 font-semibold rounded-2xl hover:bg-slate-50 hover:border-capim-400 hover:text-capim-600 transition-all shadow-sm"
          >
            <RefreshCcw size={18} />
            Nova Análise
          </button>
        </div>

      </div>

      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onSend={handleSendEmail}
        isSending={isSending}
      />
    </motion.div>
  );
}
