'use client'

import { useApp } from '@/contexts/AppContext'

export const GlobalErrorToast: React.FC = () => {
  const { globalError, clearGlobalError } = useApp()

  if (!globalError) return null

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl">
      <div className="bg-red-500/90 backdrop-blur-xl border border-red-400/60 rounded-3xl px-5 py-4 shadow-2xl flex items-center justify-between gap-4">
        <p className="text-xs font-bold text-white">
          {globalError}
        </p>
        <button
          onClick={clearGlobalError}
          className="text-[10px] font-black uppercase tracking-widest text-white/90 hover:text-white"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
