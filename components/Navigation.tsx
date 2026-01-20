'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icons } from '@/lib/constants'

interface Props {}

export const Navigation: React.FC<Props> = () => {
  const pathname = usePathname()

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

      <Link
        href="/doctor"
        className={`flex flex-col items-center gap-1 py-2 px-3 transition-all ${
          pathname === '/doctor' ? 'text-green-600 scale-110' : 'text-stone-400'
        }`}
      >
        <Icons.Phone />
        <span className="text-[10px] font-bold uppercase tracking-widest">Doctor</span>
      </Link>

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
