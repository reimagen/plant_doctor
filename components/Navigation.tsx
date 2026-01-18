'use client'

import Link from 'next/link'
import { Icons } from '@/lib/constants'

interface Props {
  currentView: 'doctor' | 'inventory' | 'settings'
}

export const Navigation: React.FC<Props> = ({ currentView }) => {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-2 flex justify-between items-center z-40">
      <Link
        href="/"
        className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all ${
          currentView === 'inventory' ? 'text-green-600 scale-110' : 'text-stone-400'
        }`}
      >
        <Icons.Inventory />
        <span className="text-[10px] font-bold uppercase tracking-widest">Jungle</span>
      </Link>

      <Link
        href="/doctor"
        className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all ${
          currentView === 'doctor' ? 'text-green-600 scale-110' : 'text-stone-400'
        }`}
      >
        <Icons.Video />
        <span className="text-[10px] font-bold uppercase tracking-widest">Doctor</span>
      </Link>

      <Link
        href="/settings"
        className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all ${
          currentView === 'settings' ? 'text-green-600 scale-110' : 'text-stone-400'
        }`}
      >
        <Icons.Settings />
        <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
      </Link>
    </nav>
  )
}
