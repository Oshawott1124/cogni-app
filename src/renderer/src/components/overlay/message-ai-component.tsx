import { useState } from 'react'
import DraggableComponent from './draggable-component'

interface ComponentPosition {
  x: number
  y: number
}

interface MessageAIComponentProps {
  isEditMode: boolean
  position?: ComponentPosition
  onPositionChange: (position: ComponentPosition) => void
}

const MessageAIComponent: React.FC<MessageAIComponentProps> = ({ 
  isEditMode, 
  position, 
  onPositionChange 
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const defaultPosition = {
    x: window.innerWidth - 320, // Right side
    y: window.innerHeight - 120 // Bottom right
  }

  const handleClick = () => {
    if (isEditMode) return

    setIsExpanded(!isExpanded)
    console.log('Message AI Component clicked - expanded:', !isExpanded)
  }

  const handleSendMessage = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isEditMode || !message.trim()) return

    setIsLoading(true)
    console.log('Sending message to AI:', message)

    // Simulate AI response (replace with actual AI integration)
    try {
      // Here you would integrate with your AI service
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      
      console.log('AI response received')
      setMessage('')
      setIsExpanded(false)
    } catch (error) {
      console.error('Error sending message to AI:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isEditMode) return
    setMessage(e.target.value)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (isEditMode) return
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (message.trim()) {
        handleSendMessage(e as any)
      }
    }
  }

  return (
    <DraggableComponent
      id="message-ai-component"
      isEditMode={isEditMode}
      position={position}
      onPositionChange={onPositionChange}
      defaultPosition={defaultPosition}
      width={300}
      height={isExpanded ? 150 : 100}
      onClick={handleClick}
      zIndex={8}
      style={{
        background: 'rgba(237, 66, 69, 0.2)',
        borderColor: 'rgba(237, 66, 69, 0.5)',
        padding: '10px',
        fontSize: '13px',
        textAlign: 'center',
        flexDirection: 'column',
        gap: '8px',
        transition: 'height 0.3s ease'
      }}
    >
      {!isExpanded ? (
        <div>
          <div style={{ fontSize: '14px', marginBottom: '4px' }}>
            💬 Message AI
          </div>
          <div style={{ fontSize: '11px', opacity: 0.8 }}>
            Click to ask a question
          </div>
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px',
          height: '100%',
          pointerEvents: isEditMode ? 'none' : 'auto'
        }}>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>
            Ask AI Assistant
          </div>
          
          <textarea
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your question..."
            disabled={isLoading || isEditMode}
            style={{
              flex: 1,
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(237, 66, 69, 0.3)',
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
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(false)
              }}
              disabled={isLoading || isEditMode}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: '#dcddde',
                fontSize: '10px',
                padding: '4px 8px',
                cursor: isEditMode ? 'default' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !message.trim() || isEditMode}
              style={{
                background: isLoading ? 'rgba(237, 66, 69, 0.3)' : 'rgba(237, 66, 69, 0.5)',
                border: '1px solid rgba(237, 66, 69, 0.7)',
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
      )}
    </DraggableComponent>
  )
}

export default MessageAIComponent
