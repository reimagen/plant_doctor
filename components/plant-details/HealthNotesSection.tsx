'use client'

interface Props {
  notes?: string[]
}

export const HealthNotesSection: React.FC<Props> = ({ notes }) => (
  <section className="bg-amber-50/40 p-5 rounded-3xl border border-amber-100/50">
    <label className="text-[10px] font-black text-amber-600/60 uppercase tracking-[0.2em] mb-2 block">
      Health Notes
    </label>
    {notes && notes.length > 0 ? (
      <ul className="space-y-2">
        {notes.map((note, i) => (
          <li key={i} className="text-xs font-bold text-amber-800/80 leading-relaxed flex gap-2">
            <span className="opacity-50">-</span> {note}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-[10px] font-medium text-amber-800/40 italic">No health issues detected yet.</p>
    )}
  </section>
)
