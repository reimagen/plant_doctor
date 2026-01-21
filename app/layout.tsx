import type { Metadata } from 'next'
import './globals.css'
import { ClientApp } from './ClientApp'

export const metadata: Metadata = {
  title: 'Plant Doctor AI',
  description: 'AI-powered plant identification, health assessment, and care recommendations',
}

export default function RootLayout() {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {/* ClientApp persists across all route navigation to maintain stream state */}
        <ClientApp />
      </body>
    </html>
  )
}
