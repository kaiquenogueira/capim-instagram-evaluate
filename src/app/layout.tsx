import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Capim Instagram Analyzer',
  description: 'Análise de perfil para clínicas e dentistas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="fixed top-0 right-0 z-[100] w-[150px] h-[150px] overflow-hidden pointer-events-none">
          <div className="absolute top-[30px] right-[-50px] w-[200px] bg-yellow-400 text-neutral-900 font-bold text-sm uppercase py-1.5 text-center transform rotate-45 shadow-sm border-y-2 border-yellow-300/50">
            Experimental
          </div>
        </div>
        {children}
      </body>
    </html>
  )
}
