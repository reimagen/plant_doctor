'use client'

interface Props {
  isOpen: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog: React.FC<Props> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white border border-stone-100 shadow-2xl p-6">
        <h3 className="text-lg font-black text-stone-800 mb-2">{title}</h3>
        {description && (
          <p className="text-sm font-medium text-stone-500 mb-6">{description}</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-stone-100 text-stone-500 hover:bg-stone-200 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-all"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
