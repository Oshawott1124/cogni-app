import DraggableComponent from './draggable-component'
import { AIResponseMessage } from './ai-response-message'
import { memo, useState, useCallback } from 'react' // Import useState and useCallback
import { useOverlayInteraction } from '@renderer/providers/overlay-interaction-context'

interface ComponentPosition {
  x: number
  y: number
}

interface SuggestionAreaProps {
  isEditMode: boolean
  position?: ComponentPosition
  onPositionChange: (position: ComponentPosition) => void
  aiResponse: string
  nextStepSuggestions: {
    label: string
    command: string
    apply: boolean
  }[]
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

const SuggestionArea: React.FC<SuggestionAreaProps> = memo(function SuggestionArea({
  isEditMode,
  position,
  onPositionChange,
  aiResponse,
  nextStepSuggestions,
  onMouseEnter,
  onMouseLeave
}: SuggestionAreaProps) {
  const [message, setMessage] = useState('') // New state for input message
  const [isExpanded, setIsExpanded] = useState(false) // New state for expand/collapse
  const [isLoading, setIsLoading] = useState(false) // New state for loading indicator

  const { setInput, sendCommand } = useOverlayInteraction() // Use the interaction context

  const defaultPosition = {
    x: window.innerWidth / 2 - 200, // Center horizontally (400px width / 2)
    y: 90 // Below control bar
  }

  const handleSendMessage = useCallback(async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    if (isEditMode || !message.trim()) return

    setIsLoading(true)
    console.log('Sending message to AI:', message)

    // Simulate AI response (replace with actual AI integration)
    try {
      // Here you would integrate with your AI service
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      
      // For now, simulate sending command via context
      sendCommand(message) 
      setInput('') // Clear input after sending

      console.log('AI response received')
      setMessage('')
      setIsExpanded(false)
    } catch (error) {
      console.error('Error sending message to AI:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isEditMode, message, setInput, sendCommand])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isEditMode) return
    setMessage(e.target.value)
    setInput(e.target.value) // Update global input state as well
  }, [isEditMode, setInput])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (isEditMode) return
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (message.trim()) {
        handleSendMessage(e)
      }
    }
  }, [isEditMode, message, handleSendMessage])

  const handleTextareaFocus = useCallback(() => {
    if (!isEditMode) {
      // Ensure window is interactive when textarea is focused
      window.electronAPI?.setMouseIgnore(false)
    }
  }, [isEditMode])

  const handleTextareaBlur = useCallback(() => {
    if (!isEditMode) {
      // Allow window to become click-through again when textarea loses focus
      setTimeout(() => {
        window.electronAPI?.setMouseIgnore(true)
      }, 100) // Small delay to prevent flickering
    }
  }, [isEditMode])

  return (
    <DraggableComponent
      id="suggestion-area"
      isEditMode={isEditMode}
      position={position}
      onPositionChange={onPositionChange}
      defaultPosition={defaultPosition}
      width={400}
      height={isExpanded ? 350 : 300} // Adjust height based on expanded state
      zIndex={9}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: 'rgba(12, 13, 13, 0.0)', // Transparent background
        // borderColor: '#5865f2',
        opacity: isEditMode ? 1 : 1,
        padding: '10px',
        flexDirection: 'column',
        gap: '8px',
        overflowY: 'auto',
        display: 'flex',
        justifyContent: 'flex-start' // Align content to the top
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          width: '100%',
          height: '100%', // Occupy full height
          justifyContent: 'space-between' // Space between AI response and input
        }}
      >
        {/* AI Response and Next Step Suggestions at the top */}
        <div>
          <AIResponseMessage
            response={aiResponse}
            suggestions={nextStepSuggestions}
            isEditMode={isEditMode}
          />
        </div>

        {/* Message AI input at the bottom */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px',
          pointerEvents: isEditMode ? 'none' : 'auto' // Disable pointer events in edit mode
        }}>
          <textarea
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onFocus={handleTextareaFocus}
            onBlur={handleTextareaBlur}
            placeholder="Type your question..."
            disabled={isLoading || isEditMode}
            style={{
              flex: 1,
              background: 'rgba(47, 49, 54, 0.8)',
              border: '1px solid rgba(47, 49, 54, 0.8)',
              borderRadius: '4px',
              color: '#dcddde',
              fontSize: '12px',
              padding: '6px',
              resize: 'none',
              outline: 'none'
            }}
          />
          
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>

            <button
              onClick={handleSendMessage}
              disabled={isLoading || !message.trim() || isEditMode}
              style={{
                background: isLoading ? 'rgba(47, 49, 54, 0.8)' : 'rgba(47, 49, 54, 0.8)',
                border: '1px solid rgba(47, 49, 54, 0.8)',
                borderRadius: '4px',
                color: '#dcddde',
                fontSize: '10px',
                padding: '4px 8px',
                cursor: isEditMode || isLoading || !message.trim() ? 'default' : 'pointer'
              }}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </DraggableComponent>
  )
})

export default SuggestionArea
