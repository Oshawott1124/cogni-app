import { useEffect, useState, useCallback } from 'react'
import ControlBar from './overlay/control-bar'
import SuggestionArea from './overlay/suggestion-area'
import HintComponent from './overlay/hint-component'
import MessageAIComponent from './overlay/message-ai-component'
import { useToast } from '@renderer/providers/toast-context'
import { OverlayInteractionContext } from '@renderer/providers/overlay-interaction-context'

interface ComponentPosition {
  x: number
  y: number
}

interface ComponentPositions {
  [key: string]: ComponentPosition
}

interface Suggestion {
  label: string
  command: string
  apply: boolean
}

const OverlayContainer: React.FC = () => {
  const [isEditMode, setIsEditMode] = useState(false)
  const [positions, setPositions] = useState<ComponentPositions>({})
  const [aiResponse, setAiResponse] = useState<string>('')
  const [nextStepSuggestions, setNextStepSuggestions] = useState<Suggestion[]>([])
  const [isMouseOverAnyComponent, setIsMouseOverAnyComponent] = useState(false) // New state
  const { showToast } = useToast()

  // Simulate an AI response and suggestions
  useEffect(() => {
    setAiResponse(
      "I can help you with that! To get started, please tell me more about what you're working on.\n\nHere are some suggestions for your next step:"
    )
    setNextStepSuggestions([
      { label: 'Summarize document', command: 'summarize', apply: true },
      { label: 'Explain code', command: 'explain code', apply: true },
      { label: 'Generate test cases', command: 'generate test cases', apply: true }
    ])
  }, [])

  // Listen for edit mode changes from main process
  useEffect(() => {
    const cleanup = window.electronAPI.onEditModeChanged?.((editMode: boolean) => {
      setIsEditMode(editMode)
      if (editMode) {
        showToast('Edit Mode', 'Drag components to reposition them', 'neutral')
      } else {
        savePositions()
        showToast('Overlay Mode', 'Components are now interactive', 'success')
      }
    })

    return () => cleanup?.()
  }, [showToast])

  // Load saved positions on mount
  useEffect(() => {
    loadSavedPositions()
  }, [])

  // Electron handles click-through dynamically
  useEffect(() => {
    if (isEditMode) {
      // In edit mode, the window should always be interactive
      window.electronAPI.setMouseIgnore(false)
    } else if (!isMouseOverAnyComponent) {
      // In overlay mode, if mouse is not over any component, make it click-through
      window.electronAPI.setMouseIgnore(true)
    } else {
      // In overlay mode, if mouse is over a component, make it interactive
      window.electronAPI.setMouseIgnore(false)
    }
  }, [isEditMode, isMouseOverAnyComponent])

  const savePositions = useCallback(() => {
    try {
      localStorage.setItem('overlayComponentPositions', JSON.stringify(positions))
      console.log('Component positions saved:', positions)
    } catch (error) {
      console.error('Error saving positions:', error)
    }
  }, [positions])

  const loadSavedPositions = useCallback(() => {
    try {
      const saved = localStorage.getItem('overlayComponentPositions')
      if (saved) {
        const savedPositions = JSON.parse(saved)
        setPositions(savedPositions)
        console.log('Component positions loaded:', savedPositions)
      }
    } catch (error) {
      console.error('Error loading positions:', error)
    }
  }, [])

  const updatePosition = useCallback((componentId: string, position: ComponentPosition) => {
    setPositions(prev => ({
      ...prev,
      [componentId]: position
    }))
  }, [])

  const setInput = useCallback((input: string) => {
    console.log('Setting input:', input)
    // In a real application, you would update a global state or send an IPC message here
  }, [])

  const sendCommand = useCallback((command: string) => {
    console.log('Sending command:', command)
    // In a real application, you would send an IPC message to the main process here
  }, [])

  return (
    <div className="overlay-container">
      {/* Background overlay - only visible in edit mode */}
      <div 
        className={`background-overlay ${isEditMode ? 'edit-mode' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: isEditMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0)',
          backdropFilter: isEditMode ? 'blur(5px)' : 'blur(0px)',
          transition: 'all 0.3s ease',
          // Electron handles click-through at window level
          zIndex: 1
        }}
      />

      {/* Edit mode indicator */}
      {isEditMode && (
        <div 
          className="edit-indicator"
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#5865f2',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            zIndex: 1001,
            pointerEvents: 'none'
          }}
        >
          EDIT MODE - Drag components to move them
        </div>
      )}

      {/* Instructions */}
      {isEditMode && (
        <div 
          className="instructions"
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(47, 49, 54, 0.9)',
            color: '#dcddde',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            zIndex: 1001,
            textAlign: 'center',
            lineHeight: 1.4,
            pointerEvents: 'none'
          }}
        >
          Press <strong>Shift+Tab</strong> to toggle edit mode<br />
          Press <strong>ESC</strong> to exit edit mode
        </div>
      )}

      {/* Overlay Components */}
      <div 
        className="components-container"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          zIndex: 2,
          // Electron handles click-through dynamically
        }}
      >
        <OverlayInteractionContext.Provider value={{ setInput, sendCommand }}>
          <ControlBar
            isEditMode={isEditMode}
            position={positions['control-bar']}
            onPositionChange={(pos) => updatePosition('control-bar', pos)}
            onMouseEnter={() => setIsMouseOverAnyComponent(true)} // Pass down mouse events
            onMouseLeave={() => setIsMouseOverAnyComponent(false)} // Pass down mouse events
          />
          
          <SuggestionArea
            isEditMode={isEditMode}
            position={positions['suggestion-area']}
            onPositionChange={(pos) => updatePosition('suggestion-area', pos)}
            aiResponse={aiResponse}
            nextStepSuggestions={nextStepSuggestions}
            onMouseEnter={() => setIsMouseOverAnyComponent(true)} // Pass down mouse events
            onMouseLeave={() => setIsMouseOverAnyComponent(false)} // Pass down mouse events
          />
          
          <HintComponent
            isEditMode={isEditMode}
            position={positions['hint-component']}
            onPositionChange={(pos) => updatePosition('hint-component', pos)}
            onMouseEnter={() => setIsMouseOverAnyComponent(true)} // Pass down mouse events
            onMouseLeave={() => setIsMouseOverAnyComponent(false)} // Pass down mouse events
          />
          
          <MessageAIComponent
            isEditMode={isEditMode}
            position={positions['message-ai-component']}
            onPositionChange={(pos) => updatePosition('message-ai-component', pos)}
            onMouseEnter={() => setIsMouseOverAnyComponent(true)} // Pass down mouse events
            onMouseLeave={() => setIsMouseOverAnyComponent(false)} // Pass down mouse events
          />
        </OverlayInteractionContext.Provider>
      </div>
    </div>
  )
}

export default OverlayContainer
