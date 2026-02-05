'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Icons } from '@/lib/constants'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export const Navigation: React.FC = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { isStreamActive } = useApp()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isStreamActive && pathname === '/doctor' && href !== '/doctor') {
      e.preventDefault()
      setPendingHref(href)
      setConfirmOpen(true)
    }
  }

  return (
    <>
      <ConfirmDialog
        isOpen={confirmOpen}
        title="End livestream?"
        description="You have an active stream. Leaving will end it."
        confirmLabel="Leave"
        cancelLabel="Stay"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          const target = pendingHref
          setConfirmOpen(false)
          setPendingHref(null)
          if (target) {
            router.push(target)
          }
        }}
      />
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-2 flex justify-around items-center z-40">
        <Link
          href="/"
          onClick={(e) => handleClick(e, '/')}
          className={`flex flex-col items-center gap-1 py-2 px-3 transition-all ${
            pathname === '/' ? 'text-green-600 scale-110' : 'text-stone-400'
          }`}
        >
          <Icons.Inventory />
          <span className="text-[10px] font-bold uppercase tracking-widest">Jungle</span>
        </Link>

        <Link
          href="/doctor"
          onClick={(e) => handleClick(e, '/doctor')}
          className={`flex flex-col items-center gap-1 py-2 px-3 transition-all ${
            pathname === '/doctor' ? 'text-green-600 scale-110' : 'text-stone-400'
          }`}
        >
          <Icons.Human />
          <span className="text-[10px] font-bold uppercase tracking-widest">DADDY</span>
        </Link>

        <Link
          href="/settings"
          onClick={(e) => handleClick(e, '/settings')}
          className={`flex flex-col items-center gap-1 py-2 px-3 transition-all ${
            pathname === '/settings' ? 'text-green-600 scale-110' : 'text-stone-400'
          }`}
        >
          <Icons.Settings />
          <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
        </Link>
      </nav>
    </>
  )
}
