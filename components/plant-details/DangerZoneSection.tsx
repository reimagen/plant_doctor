'use client'

import { Icons } from '@/lib/constants'

interface Props {
  onDelete: () => void
}

export const DangerZoneSection: React.FC<Props> = ({ onDelete }) => (
  <section className="pt-8 border-t border-stone-100 flex justify-center">
    <button
      onClick={onDelete}
      className="flex items-center gap-2 text-[10px] font-black text-stone-400 hover:text-red-500 uppercase tracking-[0.2em] transition-colors p-4"
    >
      <Icons.X />
      Remove from Jungle
    </button>
  </section>
)
