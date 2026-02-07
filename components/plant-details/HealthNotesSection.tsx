'use client'

interface Props {
  notes?: string[]
  notesSessions?: string[][]
  notesUpdatedAt?: string
}

export const HealthNotesSection: React.FC<Props> = ({ notes, notesSessions, notesUpdatedAt }) => {
  const formattedDate = notesUpdatedAt
    ? new Date(notesUpdatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null
  const sessions = notesSessions && notesSessions.length > 0
    ? notesSessions
    : (notes && notes.length > 0 ? [notes] : [])

  return (
    <section className="bg-amber-50/40 p-5 rounded-3xl border border-amber-100/50">
      <label className="text-[10px] font-black text-amber-600/60 uppercase tracking-[0.2em] mb-2 block">
        Health Notes
      </label>
      {formattedDate && (
        <p className="text-[9px] font-bold text-amber-600/50 uppercase tracking-widest mb-3">
          Last Updated: {formattedDate}
        </p>
      )}
      {sessions.length > 0 ? (
        <div className="space-y-4">
          {sessions.map((sessionNotes, sessionIndex) => (
            <div key={sessionIndex}>
              {sessions.length > 1 && (
                <p className="text-[9px] font-black text-amber-600/50 uppercase tracking-widest mb-2">
                  Update {sessionIndex + 1}
                </p>
              )}
              <ul className="space-y-2">
                {sessionNotes.map((note, noteIndex) => (
                  <li key={`${sessionIndex}-${noteIndex}`} className="text-xs font-bold text-amber-800/80 leading-relaxed flex gap-2">
                    <span className="opacity-50">-</span> {note}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] font-medium text-amber-800/40 italic">No health issues detected yet.</p>
      )}
    </section>
  )
}
