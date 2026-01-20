'use client'

interface Props {
  idealConditions?: string
}

export const IdealConditionsSection: React.FC<Props> = ({ idealConditions }) => (
  <section className="bg-emerald-50/40 p-5 rounded-3xl border border-emerald-100/50">
    <label className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.2em] mb-2 block">
      Ideal Conditions
    </label>
    <p className="text-xs font-bold text-emerald-800/80 leading-relaxed italic">
      {idealConditions || 'Scanning botanical requirements...'}
    </p>
  </section>
)
