import DraggableComponent from './draggable-component'
import { AIResponseMessage } from './ai-response-message'
import { memo, useState, useCallback, useRef } from 'react'
import { useOverlayInteraction } from '@renderer/providers/overlay-interaction-context'
import { Bot, ArrowLeft } from 'lucide-react'

interface ComponentPosition {
  x: number
  y: number
}

interface TranscriptEntry {
  id: string
  speaker: string
  text: string
  timestamp: Date
  confidence?: number
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
  // State - transcript always visible, AI shows below when triggered
  const [showAI, setShowAI] = useState(false)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening] = useState(true)

  // Transcript data - This is now the PRIMARY feature
  const [transcript] = useState<TranscriptEntry[]>([
    {
      id: '1',
      speaker: 'John',
      text: "Let's start today's meeting. We need to discuss the Q4 budget allocation.",
      timestamp: new Date(Date.now() - 300000),
      confidence: 0.95
    },
    {
      id: '2',
      speaker: 'Sarah',
      text: 'I think we should prioritize marketing spend for the new product launch.',
      timestamp: new Date(Date.now() - 240000),
      confidence: 0.92
    },
    {
      id: '3',
      speaker: 'Mike',
      text: "What about the development team resources? We're stretched thin.",
      timestamp: new Date(Date.now() - 180000),
      confidence: 0.88
    },
    {
      id: '4',
      speaker: 'John',
      text: "Good point. Let's review the current capacity first.",
      timestamp: new Date(Date.now() - 120000),
      confidence: 0.94
    }
  ])

  const transcriptRef = useRef<HTMLDivElement>(null)
  const { setInput, sendCommand } = useOverlayInteraction()

  const defaultPosition = {
    x: window.innerWidth / 2 - 200, // Center horizontally (400px width / 2)
    y: 90 // Below control bar
  }

  // AI toggle handlers
  const handleShowAI = useCallback(() => {
    if (isEditMode) return
    setShowAI(true)
  }, [isEditMode])

  const handleHideAI = useCallback(() => {
    setShowAI(false)
    setMessage('')
  }, [])

  const handleTextareaFocus = useCallback(() => {
    if (window.electronAPI?.setMouseIgnore) {
      window.electronAPI.setMouseIgnore(false)
    }
  }, [])

  const handleTextareaBlur = useCallback(() => {
    setTimeout(() => {
      if (window.electronAPI?.setMouseIgnore) {
        window.electronAPI.setMouseIgnore(true)
      }
    }, 100)
  }, [])

  const handleSendMessage = useCallback(
    async (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation()
      if (isEditMode || !message.trim()) return

      setIsLoading(true)
      console.log('Sending message to AI:', message)

      // Simulate AI response (replace with actual AI integration)
      try {
        // Here you would integrate with your AI service
        await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API call

        // For now, simulate sending command via context
        sendCommand(message)
        setInput('') // Clear input after sending

        console.log('AI response received')
        setMessage('')
      } catch (error) {
        console.error('Error sending message to AI:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [isEditMode, message, setInput, sendCommand]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (isEditMode) return
      setMessage(e.target.value)
      setInput(e.target.value) // Update global input state as well
    },
    [isEditMode, setInput]
  )

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (isEditMode) return

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (message.trim()) {
          handleSendMessage(e)
        }
      }
    },
    [isEditMode, message, handleSendMessage]
  )

  return (
    <DraggableComponent
      id="suggestion-area"
      isEditMode={isEditMode}
      position={position}
      onPositionChange={onPositionChange}
      defaultPosition={defaultPosition}
      width={500} // Increased from 400 for better readability
      height={showAI ? 700 : 450} // Increased heights, dynamic based on AI visibility
      zIndex={9}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: 'rgba(12, 13, 13, 0.7)', // Transparent background
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
          height: '100%'
        }}
      >
        {/* Header with AI toggle - Notion-style */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                background: isListening ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                borderRadius: '12px',
                border: `1px solid ${isListening ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)'}`
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isListening ? '#22c55e' : '#6b7280',
                  animation: isListening ? 'pulse 2s infinite' : 'none'
                }}
              />
              <span
                style={{
                  color: isListening ? '#22c55e' : '#9ca3af',
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '-0.01em'
                }}
              >
                {isListening ? 'LIVE' : 'PAUSED'}
              </span>
            </div>
            <span
              style={{
                color: '#e1e5e9',
                fontSize: '14px',
                fontWeight: 500,
                letterSpacing: '-0.01em'
              }}
            >
              Meeting Transcript
            </span>
          </div>
          {!showAI ? (
            <button
              onClick={handleShowAI}
              disabled={isEditMode}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '5px',
                color: '#e1e5e9',
                fontSize: '12px',
                fontWeight: 500,
                padding: '6px 12px',
                cursor: isEditMode ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
                letterSpacing: '-0.01em'
              }}
              onMouseEnter={(e) => {
                if (!isEditMode) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isEditMode) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                }
              }}
            >
              <Bot size={13} />
              Ask AI
            </button>
          ) : (
            <button
              onClick={handleHideAI}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '5px',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '12px',
                fontWeight: 500,
                padding: '6px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
                letterSpacing: '-0.01em'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
              }}
            >
              <ArrowLeft size={13} />
              Hide AI
            </button>
          )}
        </div>

        {/* Transcript Content - Always visible, different style from AI */}
        <div
          ref={transcriptRef}
          style={{
            flex: showAI ? '0 0 40%' : 1, // Take less space when AI is shown
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            minHeight: showAI ? '120px' : 'auto'
          }}
        >
          {transcript.map((entry, index) => (
            <div
              key={entry.id}
              style={{
                // Transcript styling - Notion-like clean entries
                padding: '8px 0',
                borderBottom:
                  index < transcript.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                background: 'transparent',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      color: '#a1a1aa',
                      fontSize: '12px',
                      fontWeight: 500,
                      letterSpacing: '-0.01em'
                    }}
                  >
                    {entry.speaker}
                  </span>
                  <span
                    style={{
                      color: 'rgba(255, 255, 255, 0.4)',
                      fontSize: '11px',
                      fontWeight: 400
                    }}
                  >
                    {entry.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {entry.confidence && (
                  <div
                    style={{
                      padding: '2px 6px',
                      background:
                        entry.confidence > 0.9
                          ? 'rgba(34, 197, 94, 0.08)'
                          : 'rgba(245, 158, 11, 0.08)',
                      border:
                        entry.confidence > 0.9
                          ? '1px solid rgba(34, 197, 94, 0.15)'
                          : '1px solid rgba(245, 158, 11, 0.15)',
                      borderRadius: '4px'
                    }}
                  >
                    <span
                      style={{
                        color: entry.confidence > 0.9 ? '#22c55e' : '#f59e0b',
                        fontSize: '10px',
                        fontWeight: 500
                      }}
                    >
                      {Math.round(entry.confidence * 100)}%
                    </span>
                  </div>
                )}
              </div>
              <p
                style={{
                  color: '#e1e5e9',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  margin: 0,
                  fontWeight: 400,
                  letterSpacing: '-0.01em'
                }}
              >
                {entry.text}
              </p>
            </div>
          ))}
        </div>

        {/* AI Section - Shows below transcript when triggered */}
        {showAI && (
          <div
            style={{
              flex: '0 0 60%',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)', // Notion-style subtle divider
              paddingTop: '16px',
              marginTop: '8px'
            }}
          >
            {/* AI Response - Notion-style clean card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)', // Very subtle background
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.06)', // Minimal border
                padding: '16px',
                transition: 'all 0.2s ease'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Bot size={11} color="white" />
                </div>
                <span
                  style={{
                    color: '#e1e5e9',
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '-0.01em'
                  }}
                >
                  AI Assistant
                </span>
              </div>
              <AIResponseMessage
                response={aiResponse}
                suggestions={nextStepSuggestions}
                isEditMode={isEditMode}
              />
            </div>

            {/* AI Input - Notion-style input */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                pointerEvents: isEditMode ? 'none' : 'auto'
              }}
            >
              <div
                style={{
                  position: 'relative'
                }}
              >
                <textarea
                  value={message}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about the meeting..."
                  disabled={isLoading || isEditMode}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.03)', // Very subtle background
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    color: '#e1e5e9',
                    fontSize: '13px',
                    fontWeight: 400,
                    padding: '12px 16px',
                    resize: 'none',
                    outline: 'none',
                    minHeight: '44px',
                    fontFamily: 'inherit',
                    lineHeight: '1.4',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    handleTextareaFocus()
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                  }}
                  onBlur={(e) => {
                    handleTextareaBlur()
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}
              >
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !message.trim() || isEditMode}
                  style={{
                    background:
                      isLoading || !message.trim() || isEditMode
                        ? 'rgba(255, 255, 255, 0.04)'
                        : 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '5px',
                    color:
                      isLoading || !message.trim() || isEditMode
                        ? 'rgba(255, 255, 255, 0.3)'
                        : '#e1e5e9',
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '8px 16px',
                    cursor: isLoading || !message.trim() || isEditMode ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    letterSpacing: '-0.01em'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && message.trim() && !isEditMode) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading && message.trim() && !isEditMode) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                    }
                  }}
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DraggableComponent>
  )
})

export default SuggestionArea
