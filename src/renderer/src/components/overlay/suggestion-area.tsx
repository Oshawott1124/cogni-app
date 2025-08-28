import DraggableComponent from './draggable-component'
import { AIResponseMessage } from './ai-response-message'

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
}

const SuggestionArea: React.FC<SuggestionAreaProps> = ({
  isEditMode,
  position,
  onPositionChange,
  aiResponse,
  nextStepSuggestions
}) => {
  const defaultPosition = {
    x: window.innerWidth / 2 - 200, // Center horizontally (400px width / 2)
    y: 90 // Below control bar
  }

  return (
    <DraggableComponent
      id="suggestion-area"
      isEditMode={isEditMode}
      position={position}
      onPositionChange={onPositionChange}
      defaultPosition={defaultPosition}
      width={400}
      height={300} // Increased height to accommodate chat-like content
      zIndex={9}
      style={{
        background: 'rgba(12, 13, 13, 0.0)', // Transparent background
        // borderColor: '#5865f2',
        opacity: isEditMode ? 1 : 1,
        padding: '10px',
        flexDirection: 'column',
        gap: '8px',
        overflowY: 'auto',
        display: 'flex',
        justifyContent: 'flex-end' // Align content to the bottom (chat-like)
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          width: '100%'
        }}
      >
        {/* AI Response will be rendered here */}
        <AIResponseMessage 
          response={aiResponse} 
          suggestions={nextStepSuggestions}
          isEditMode={isEditMode}
        />
      </div>
    </DraggableComponent>
  )
}

export default SuggestionArea
