'use client';

import { motion } from 'framer-motion';
import { RefreshCcw, Share2, Award, TrendingUp, Users, Grid, UserCheck, Heart, MessageCircle, Star, ChevronDown, ChevronUp, Sparkles, Repeat, Fingerprint } from 'lucide-react';
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
    <div className={`border-t border-neutral-200/60 ${className}`}>
      <button 
        onClick={() => setLocalIsOpen(!localIsOpen)}
        className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-neutral-50/50 transition-colors text-left"
      >
        <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <Icon size={24} className="text-capim-600" />
          {title}
        </h3>
        {isOpen ? <ChevronUp className="text-neutral-400" /> : <ChevronDown className="text-neutral-400" />}
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

const MetricCard = ({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: { hex: string, bg: string, text: string } }) => (
  <div className="flex flex-col items-center p-5 bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-all h-full justify-between">
    <div className="flex items-center gap-2 mb-3 w-full">
       <div className={`p-2 rounded-lg ${color.bg} ${color.text}`}>
         <Icon size={18} />
       </div>
       <span className="text-sm font-bold text-neutral-700">{title}</span>
    </div>
    <div className="flex-1 flex items-center justify-center py-2">
       <CircularProgress value={value} color={color.hex} size={90} strokeWidth={8} />
    </div>
  </div>
);

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
               element.style.maxWidth = '1200px';
               element.style.margin = '0';
               element.style.borderRadius = '0'; // Remove rounded corners for PDF
               element.style.border = 'none'; // Remove border for cleaner look
               element.style.boxShadow = 'none'; // Remove shadow
               
               // Fix Header Alignment in PDF
               const header = element.querySelector('.bg-gradient-to-r');
               if (header instanceof HTMLElement) {
                  header.style.paddingRight = '40px'; // Add extra padding
                  header.style.display = 'flex';
                  header.style.justifyContent = 'space-between';
               }

               // Fix Ranking Indicator overlap
               const scoreContainer = element.querySelector('.flex.flex-col.items-end');
               if (scoreContainer instanceof HTMLElement) {
                  scoreContainer.style.minWidth = '180px'; // Give it more space
                  scoreContainer.style.display = 'flex';
                  scoreContainer.style.flexDirection = 'column';
                  scoreContainer.style.alignItems = 'flex-end';
               }
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
            <div className="w-px h-16 bg-neutral-200 hidden md:block"></div>
            <button 
              onClick={handleShare}
              className="p-3 text-neutral-400 hover:text-capim-600 hover:bg-capim-50 rounded-full transition-all"
            >
               <Share2 size={24} />
            </button>
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

        {/* AI Summary Section - Full Width */}
        <div className="p-6 md:p-8 border-b border-neutral-200/60 bg-white">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Award size={20} className="text-capim-600" />
            Resumo da Análise
          </h3>
          <p className="text-neutral-700 leading-relaxed text-lg bg-capim-50/50 p-6 rounded-2xl border border-capim-100">
            {result.summary}
          </p>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 border-b border-neutral-200/60">
          
          {/* Metrics Grid */}
          <div className="flex flex-col items-center justify-center bg-neutral-50 rounded-2xl p-6 border border-neutral-200/60 h-full">
            <h3 className="text-lg font-semibold text-neutral-800 mb-5 flex items-center gap-2 w-full">
              <TrendingUp size={24} className="text-capim-600" />
              Métricas do Perfil
            </h3>
            <div className="grid grid-cols-2 gap-4 w-full h-full">
              <MetricCard 
                title="Qualidade" 
                value={result.metrics?.quality ?? 0} 
                icon={Sparkles} 
                color={{ hex: '#9333ea', bg: 'bg-purple-50', text: 'text-purple-600' }} 
              />
              <MetricCard 
                title="Consistência" 
                value={result.metrics?.consistency ?? 0} 
                icon={Repeat} 
                color={{ hex: '#3DE4F5', bg: 'bg-blue-50', text: 'text-blue-600' }} 
              />
              <MetricCard 
                title="Branding" 
                value={result.metrics?.branding ?? 0} 
                icon={Fingerprint} 
                color={{ hex: '#E94A4A', bg: 'bg-pink-50', text: 'text-pink-600' }} 
              />
              <MetricCard 
                title="Interação" 
                value={result.metrics?.interaction ?? 0} 
                icon={MessageCircle} 
                color={{ hex: '#F1AF0F', bg: 'bg-orange-50', text: 'text-orange-600' }} 
              />
            </div>
          </div>

          {/* Detailed Metrics Checklist (Moved from Accordion) */}
          <div className="flex flex-col bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
            <h3 className="text-lg font-semibold text-neutral-800 mb-6 flex items-center gap-2">
              <Award size={24} className="text-capim-600" />
              Checklist de Qualidade
            </h3>
            
            {result.detailedMetrics && (
               <div className="flex flex-col justify-center flex-1 space-y-8">
                  {/* Item 1 */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2 text-neutral-700">
                      <span>Frequência e Constância</span>
                      <span className="text-neutral-900">{result.detailedMetrics.criteria.frequency}/100</span>
                    </div>
                    <div className="h-3 bg-neutral-100 rounded-full overflow-hidden border border-neutral-100">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.detailedMetrics.criteria.frequency}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${result.detailedMetrics.criteria.frequency >= 70 ? 'bg-lime-700' : result.detailedMetrics.criteria.frequency >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} 
                      />
                    </div>
                  </div>
                   {/* Item 2 */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2 text-neutral-700">
                      <span>Links e CTA</span>
                      <span className="text-neutral-900">{result.detailedMetrics.criteria.ctaAndLinks}/100</span>
                    </div>
                    <div className="h-3 bg-neutral-100 rounded-full overflow-hidden border border-neutral-100">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.detailedMetrics.criteria.ctaAndLinks}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                        className={`h-full rounded-full ${result.detailedMetrics.criteria.ctaAndLinks >= 70 ? 'bg-lime-700' : result.detailedMetrics.criteria.ctaAndLinks >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} 
                      />
                    </div>
                  </div>
                   {/* Item 3 */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2 text-neutral-700">
                      <span>Clareza de Posicionamento</span>
                      <span className="text-neutral-900">{result.detailedMetrics.criteria.positioningClarity}/100</span>
                    </div>
                    <div className="h-3 bg-neutral-100 rounded-full overflow-hidden border border-neutral-100">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.detailedMetrics.criteria.positioningClarity}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                        className={`h-full rounded-full ${result.detailedMetrics.criteria.positioningClarity >= 70 ? 'bg-lime-700' : result.detailedMetrics.criteria.positioningClarity >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} 
                      />
                    </div>
                  </div>
                   {/* Item 4 */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2 text-neutral-700">
                      <span>Prova Social</span>
                      <span className="text-neutral-900">{result.detailedMetrics.criteria.socialProof}/100</span>
                    </div>
                    <div className="h-3 bg-neutral-100 rounded-full overflow-hidden border border-neutral-100">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.detailedMetrics.criteria.socialProof}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                        className={`h-full rounded-full ${result.detailedMetrics.criteria.socialProof >= 70 ? 'bg-lime-700' : result.detailedMetrics.criteria.socialProof >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} 
                      />
                    </div>
                  </div>
               </div>
            )}
          </div>
        </div>

        {/* Dicas para crescer Section */}
        {result.tips && result.tips.length > 0 && (
          <CollapsibleSection
            title="Dicas para crescer"
            icon={TrendingUp}
            forceOpen={isGeneratingPdf}
            defaultOpen={true}
            className="bg-white"
          >
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
              <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2 text-neutral-700">
                      <span>Clareza da Proposta</span>
                      <span>{result.bioAnalysis.clarity}/100</span>
                    </div>
                    <div className="h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.bioAnalysis.clarity}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-capim-500 rounded-full" 
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2 text-neutral-700">
                      <span>Otimização para Conversão  </span>
                      <span>{result.bioAnalysis.cro}/100</span>
                    </div>
                    <div className="h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.bioAnalysis.cro}%` }}
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
          </CollapsibleSection>
        )}

        {/* Posts Analysis Section */}
        {result.postsAnalysis && result.postsAnalysis.length > 0 && (
          <CollapsibleSection
            title="Análise Visual dos Últimos Posts"
            icon={Grid}
            className="bg-neutral-50/30"
            forceOpen={isGeneratingPdf}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {result.postsAnalysis.map((post, idx) => (
                <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 + 0.3 }}
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
                </motion.div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        <div className="p-6 bg-neutral-50 border-t border-neutral-200/60 flex justify-center">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-8 py-3 bg-white border border-neutral-300 text-neutral-800 font-semibold rounded-2xl hover:bg-neutral-50 hover:border-capim-400 hover:text-capim-600 transition-all shadow-sm"
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