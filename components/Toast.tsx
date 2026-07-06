"use client"

import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react"

type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, "id">) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const STYLES = {
  success: "border-green-200 bg-neutral-900 text-green-800 [&_.icon]:text-green-500 [&_.bar]:bg-green-400",
  error:   "border-red-200   bg-neutral-900 text-red-800   [&_.icon]:text-red-500   [&_.bar]:bg-red-400",
  warning: "border-amber-200 bg-neutral-900 text-amber-800 [&_.icon]:text-amber-500 [&_.bar]:bg-amber-400",
  info:    "border-blue-200  bg-neutral-900 text-blue-800  [&_.icon]:text-blue-500  [&_.bar]:bg-blue-400",
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const Icon = ICONS[toast.type]
  const duration = toast.duration ?? 4000

  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), duration)
    return () => clearTimeout(t)
  }, [toast.id, duration, onRemove])

  return (
    <div
      className={`relative flex items-start gap-3 rounded-xl border shadow-lg p-4 pr-10 w-80 animate-[slideUp_0.25s_ease-out] overflow-hidden ${STYLES[toast.type]}`}
    >
      <Icon className="icon w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-snug">{toast.title}</p>
        {toast.message && <p className="text-xs mt-0.5 opacity-80 leading-relaxed">{toast.message}</p>}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="absolute top-3 right-3 opacity-50 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
      {/* Progress bar */}
      <div
        className="bar absolute bottom-0 left-0 h-0.5 rounded-full"
        style={{ animation: `shrink ${duration}ms linear forwards` }}
      />
      <style>{`
        @keyframes shrink { from { width: 100% } to { width: 0% } }
        @keyframes slideUp { from { transform: translateY(8px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const add = useCallback((opts: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev.slice(-4), { ...opts, id }])
  }, [])

  const value: ToastContextValue = {
    toast: add,
    success: (title, message) => add({ type: "success", title, message }),
    error:   (title, message) => add({ type: "error",   title, message }),
    warning: (title, message) => add({ type: "warning", title, message }),
    info:    (title, message) => add({ type: "info",    title, message }),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
