import { useState, useEffect } from 'react'
import DraggableComponent from './draggable-component'

interface ComponentPosition {
  x: number
  y: number
}

interface SuggestionBubblesProps {
  isEditMode: boolean
  position?: ComponentPosition
  onPositionChange: (position: ComponentPosition) => void
}

const SuggestionBubbles: React.FC<SuggestionBubblesProps> = ({ 
  isEditMode, 
  position, 
  onPositionChange 
}) => {
  const [suggestions, setSuggestions] = useState([
    'Ask about the current topic',
    'Summarize key points',
    'Generate action items'
  ])
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null)

  const defaultPosition = {
    x: window.innerWidth / 2 - 200, // Center horizontally (400px width / 2)
    y: 90 // Below control bar
  }

  // Simulate dynamic suggestions (you can replace with real AI suggestions)
  useEffect(() => {
    const interval = setInterval(() => {
      const allSuggestions = [
        'Ask about the current topic',
        'Summarize key points',
        'Generate action items',
        'Explain this concept',
        'Find related resources',
        'Create a follow-up task',
        'Schedule a reminder',
        'Share this information'
      ]
      
      // Randomly select 3 suggestions
      const shuffled = allSuggestions.sort(() => 0.5 - Math.random())
      setSuggestions(shuffled.slice(0, 3))
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const handleClick = () => {
    if (isEditMode) return

    console.log('Suggestion Bubbles clicked!')
    // You can implement suggestion selection logic here
  }

  const handleSuggestionClick = (suggestion: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (isEditMode) return

    setSelectedSuggestion(suggestion)
    console.log('Selected suggestion:', suggestion)
    
    // Here you would send the suggestion to your AI system
    // For demo purposes, just show visual feedback
    setTimeout(() => {
      setSelectedSuggestion(null)
    }, 2000)
  }

  return (
    <DraggableComponent
      id="suggestion-bubbles"
      isEditMode={isEditMode}
      position={position}
      onPositionChange={onPositionChange}
      defaultPosition={defaultPosition}
      width={400}
      height={80}
      onClick={handleClick}
      zIndex={9}
      style={{
        background: 'rgba(47, 49, 54, 0.9)',
        borderColor: selectedSuggestion ? '#7289da' : '#5865f2',
        opacity: isEditMode ? 1 : 0.9,
        padding: '10px',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      <div style={{ 
        fontSize: '12px', 
        opacity: 0.8, 
        marginBottom: '4px',
        textAlign: 'center'
      }}>
        AI Suggestions
      </div>
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            onClick={(e) => handleSuggestionClick(suggestion, e)}
            style={{
              padding: '4px 8px',
              background: selectedSuggestion === suggestion 
                ? 'rgba(88, 101, 242, 0.3)' 
                : 'rgba(88, 101, 242, 0.1)',
              borderRadius: '12px',
              fontSize: '11px',
              cursor: isEditMode ? 'inherit' : 'pointer',
              transition: 'all 0.2s ease',
              border: selectedSuggestion === suggestion 
                ? '1px solid #5865f2' 
                : '1px solid transparent',
              pointerEvents: isEditMode ? 'none' : 'auto'
            }}
          >
            {suggestion}
          </div>
        ))}
      </div>
    </DraggableComponent>
  )
}

export default SuggestionBubbles
