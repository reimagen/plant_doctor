import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/contexts/AppContext'
import { Navigation } from '@/components/Navigation'
import { GlobalErrorToast } from '@/components/GlobalErrorToast'

export const metadata: Metadata = {
  title: 'Plant Doctor AI',
  description: 'AI-powered plant identification, health assessment, and care recommendations',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AppProvider>
          <GlobalErrorToast />
          <main className="min-h-screen bg-stone-50 max-w-xl mx-auto">
            {children}
          </main>
          <Navigation />
        </AppProvider>
      </body>
    </html>
  )
}
