'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icons } from '@/lib/constants'

interface Props {
  stream: MediaStream | null
  isConnecting: boolean
  onStart: (video: boolean) => Promise<void>
  onStop: () => void
}

export const Navigation: React.FC<Props> = ({ stream, isConnecting, onStart, onStop }) => {
  const pathname = usePathname()
  const isDoctorActive = pathname === '/doctor'

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-2 flex justify-around items-center z-40">
      <Link
        href="/"
        className={`flex flex-col items-center gap-1 py-2 px-3 transition-all ${
          pathname === '/' ? 'text-green-600 scale-110' : 'text-stone-400'
        }`}
      >
        <Icons.Inventory />
        <span className="text-[10px] font-bold uppercase tracking-widest">Jungle</span>
      </Link>

      {stream ? (
        <button
          onClick={onStop}
          className="flex flex-col items-center gap-1 py-2 px-3 text-red-500 scale-110 transition-all animate-pulse"
        >
          <Icons.Stop />
          <span className="text-[10px] font-bold uppercase tracking-widest">Stop</span>
        </button>
      ) : (
        <>
          <button
            onClick={() => onStart(true)}
            disabled={isConnecting}
            className={`flex flex-col items-center gap-1 py-2 px-3 transition-all ${
              isDoctorActive ? 'text-green-600 scale-110' : 'text-stone-400'
            } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Icons.Video />
            <span className="text-[10px] font-bold uppercase tracking-widest">Doctor</span>
          </button>
          <button
            onClick={() => onStart(false)}
            disabled={isConnecting}
            className={`flex flex-col items-center gap-1 py-2 px-3 transition-all ${
              isDoctorActive ? 'text-green-600' : 'text-stone-400'
            } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Icons.Microphone />
            <span className="text-[10px] font-bold uppercase tracking-widest">Listen</span>
          </button>
        </>
      )}

      <Link
        href="/settings"
        className={`flex flex-col items-center gap-1 py-2 px-3 transition-all ${
          pathname === '/settings' ? 'text-green-600 scale-110' : 'text-stone-400'
        }`}
      >
        <Icons.Settings />
        <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
      </Link>
    </nav>
  )
}
