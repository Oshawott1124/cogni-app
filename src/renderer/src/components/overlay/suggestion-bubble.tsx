import { useCallback } from 'react'
import { useOverlayInteraction } from '@renderer/providers/overlay-interaction-context'

interface SuggestionBubbleProps {
  suggestion: {
    label: string
    command: string
    apply: boolean
  }
}

export function SuggestionBubble({ suggestion }: SuggestionBubbleProps) {
  const { setInput, sendCommand } = useOverlayInteraction()

  const handleApply = useCallback(() => {
    setInput(suggestion.command)
    if (suggestion.apply) {
      sendCommand(suggestion.command)
    }
  }, [suggestion, setInput, sendCommand])

  return (
    <div
      className="flex cursor-pointer items-center justify-center rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-100 shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
      onClick={handleApply}
    >
      {suggestion.label}
    </div>
  )
}
