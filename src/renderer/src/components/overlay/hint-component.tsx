import { useState, useEffect } from 'react'
import DraggableComponent from './draggable-component'

interface ComponentPosition {
  x: number
  y: number
}

interface HintComponentProps {
  isEditMode: boolean
  position?: ComponentPosition
  onPositionChange: (position: ComponentPosition) => void
}

const HintComponent: React.FC<HintComponentProps> = ({ 
  isEditMode, 
  position, 
  onPositionChange 
}) => {
  const [currentHint, setCurrentHint] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const hints = [
    '💡 Press Shift+Tab to enter edit mode',
    '🎯 Click components to interact with them',
    '🔊 Use the control bar for voice input',
    '📝 AI suggestions appear automatically',
    '⚡ Press ESC to exit edit mode',
    '🎨 Drag components to customize layout'
  ]

  const defaultPosition = {
    x: 20,
    y: window.innerHeight - 90 // Bottom left
  }

  // Cycle through hints
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHint((prev) => (prev + 1) % hints.length)
    }, 5000) // Change hint every 5 seconds

    return () => clearInterval(interval)
  }, [hints.length])

  const handleClick = () => {
    if (isEditMode) return

    // Cycle to next hint immediately
    setCurrentHint((prev) => (prev + 1) % hints.length)
    console.log('Hint Component clicked - showing next hint')
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isEditMode) return

    setIsVisible(false)
    console.log('Hint dismissed')
    
    // Show again after 30 seconds
    setTimeout(() => {
      setIsVisible(true)
    }, 30000)
  }

  if (!isVisible && !isEditMode) {
    return null
  }

  return (
    <DraggableComponent
      id="hint-component"
      isEditMode={isEditMode}
      position={position}
      onPositionChange={onPositionChange}
      defaultPosition={defaultPosition}
      width={250}
      height={70}
      onClick={handleClick}
      zIndex={8}
      style={{
        background: 'rgba(88, 101, 242, 0.2)',
        borderColor: 'rgba(88, 101, 242, 0.5)',
        opacity: isEditMode ? 1 : (isVisible ? 0.9 : 0.3),
        padding: '10px',
        fontSize: '12px',
        textAlign: 'center',
        flexDirection: 'column',
        gap: '4px'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        width: '100%',
        marginBottom: '4px'
      }}>
        <div style={{ fontSize: '10px', opacity: 0.7 }}>
          Hint {currentHint + 1}/{hints.length}
        </div>
        {!isEditMode && (
          <button
            onClick={handleDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: '#dcddde',
              cursor: 'pointer',
              fontSize: '12px',
              opacity: 0.7,
              padding: '0',
              lineHeight: 1
            }}
          >
            ×
          </button>
        )}
      </div>
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        lineHeight: 1.3
      }}>
        {hints[currentHint]}
      </div>
    </DraggableComponent>
  )
}

export default HintComponent
