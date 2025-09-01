import { useCallback } from 'react'
import DraggableComponent from './draggable-component'
import { useOverlayInteraction } from '@renderer/providers/overlay-interaction-context'

interface ComponentPosition {
  x: number
  y: number
}

interface NotesComponentProps {
  isEditMode: boolean
  position?: ComponentPosition
  onPositionChange: (position: ComponentPosition) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

const presentationNotes = `
- **Introduction (1 min)**
  - Welcome and agenda overview.
  - Briefly introduce the project's goals.

- **Demo (3 mins)**
  - Showcase the main features: A, B, and C.
  - Highlight the seamless user experience.

- **Q&A (1 min)**
  - Open the floor for questions.
`

const NotesComponent: React.FC<NotesComponentProps> = ({
  isEditMode,
  position,
  onPositionChange,
  onMouseEnter,
  onMouseLeave
}) => {
  const { setInput } = useOverlayInteraction()

  const defaultPosition = {
    x: window.innerWidth - 320, // Positioned on the top right
    y: 90 // Parallel to the suggestion area
  }

  const handleNoteClick = useCallback(() => {
    if (isEditMode) return

    const selection = window.getSelection()
    const selectedText = selection?.toString().trim()

    if (selectedText) {
      setInput(selectedText)
      console.log('Selected text sent to AI:', selectedText)
    }
  }, [isEditMode, setInput])

  return (
    <DraggableComponent
      id="notes-component"
      isEditMode={isEditMode}
      position={position}
      onPositionChange={onPositionChange}
      defaultPosition={defaultPosition}
      width={300} // Larger width
      height={300} // Larger height
      onClick={handleNoteClick}
      zIndex={8}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: 'rgba(30, 31, 34, 0.8)',
        borderColor: 'rgba(88, 101, 242, 0.5)',
        padding: '16px',
        fontSize: '14px',
        textAlign: 'left',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '8px',
        overflowY: 'auto'
      }}
    >
      <h3
        style={{
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '8px',
          color: '#ffffff'
        }}
      >
        Presentation Notes
      </h3>
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', color: '#dcddde' }}>
        {presentationNotes}
      </div>
    </DraggableComponent>
  )
}

export default NotesComponent
