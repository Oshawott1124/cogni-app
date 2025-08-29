import { SuggestionBubble } from './suggestion-bubble'
import { useCallback, memo } from 'react'
import { useOverlayInteraction } from '@renderer/providers/overlay-interaction-context'

interface Suggestion {
  label: string
  command: string
  apply: boolean
}

interface AIResponseMessageProps {
  response: string
  suggestions: Suggestion[]
  isEditMode: boolean
}

export const AIResponseMessage = memo(function AIResponseMessage({
  response,
  suggestions,
  isEditMode
}: AIResponseMessageProps) {
  const { setInput, sendCommand } = useOverlayInteraction()

  const handleBubbleClick = useCallback(
    (suggestion: Suggestion) => {
      setInput(suggestion.command)
      if (suggestion.apply) {
        sendCommand(suggestion.command)
      }
    },
    [setInput, sendCommand]
  )

  return (
    <div className="flex flex-col gap-2">
      <div
        style={{
          background: 'rgba(47, 49, 54, 0.8)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '13px',
          color: '#dcddde',
          whiteSpace: 'pre-wrap'
        }}
      >
        {response}
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap justify-end gap-2">
          {suggestions.map((suggestion, index) => (
            <div key={index} onClick={() => handleBubbleClick(suggestion)}>
              <SuggestionBubble suggestion={suggestion} isEditMode={isEditMode} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
