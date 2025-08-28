import { createContext, useContext, useCallback } from 'react'

interface OverlayInteractionContextType {
  setInput: (input: string) => void
  sendCommand: (command: string) => void
}

export const OverlayInteractionContext = createContext<OverlayInteractionContextType | undefined>(undefined)

export function useOverlayInteraction(): OverlayInteractionContextType {
  const context = useContext(OverlayInteractionContext)
  if (!context) {
    throw new Error('useOverlayInteraction must be used within an OverlayInteractionProvider')
  }
  return context
}
