/**
 * Sonner Toaster - Configurado com tema do app
 * Design: Minimalismo Espiritual Contemporâneo
 * Cores: Navy Blue (#1e3a5f) + Dourado (#d4a574)
 */
import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          fontFamily: "'Poppins', sans-serif",
        },
        classNames: {
          toast: "!bg-[#1e3a5f] !text-white !border-[#d4a574]/30 !shadow-xl",
          title: "!text-white !font-semibold",
          description: "!text-white/80",
          success: "!bg-[#1e3a5f] !border-l-4 !border-l-green-400",
          error: "!bg-[#1e3a5f] !border-l-4 !border-l-red-400",
          warning: "!bg-[#1e3a5f] !border-l-4 !border-l-[#d4a574]",
          info: "!bg-[#1e3a5f] !border-l-4 !border-l-blue-400",
          actionButton: "!bg-[#d4a574] !text-[#1e3a5f] !font-semibold",
          cancelButton: "!bg-white/20 !text-white",
          closeButton: "!bg-white/10 !text-white hover:!bg-white/20",
        },
      }}
    />
  )
}
