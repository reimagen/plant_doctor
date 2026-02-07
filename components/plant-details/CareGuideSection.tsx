'use client'

interface Props {
  careGuide?: string[]
  careGuideGeneratedAt?: string
  isGenerating: boolean
  onGenerate: () => void
}

export const CareGuideSection: React.FC<Props> = ({ careGuide, careGuideGeneratedAt, isGenerating, onGenerate }) => {
  const formattedDate = careGuideGeneratedAt
    ? new Date(careGuideGeneratedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
          Care Guide
        </label>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="text-[10px] font-black text-green-600 uppercase tracking-widest disabled:opacity-50 hover:text-green-700 transition-colors"
        >
          {isGenerating ? 'Analyzing...' : 'Refresh Protocol'}
        </button>
      </div>
      {formattedDate && (
        <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mb-4">
          Last Generated: {formattedDate}
        </p>
      )}
      <div className="space-y-3">
        {careGuide && careGuide.length > 0 ? (
          careGuide.map((tip, i) => (
            <div key={i} className="flex gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
              <p className="text-xs font-bold text-stone-600 leading-relaxed">{tip}</p>
            </div>
          ))
        ) : (
          <div className="p-8 border-2 border-dashed border-stone-100 rounded-3xl text-center">
            <p className="text-[10px] font-black text-stone-300 uppercase">No active protocol</p>
          </div>
        )}
      </div>
    </section>
  )
}
