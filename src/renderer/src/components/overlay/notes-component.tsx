import { useCallback, useState, useEffect, useRef } from 'react'
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



const NotesComponent: React.FC<NotesComponentProps> = ({
  isEditMode,
  position,
  onPositionChange,
  onMouseEnter,
  onMouseLeave
}) => {
  const { setInput } = useOverlayInteraction()
  const [notes, setNotes] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load session notes on component mount
  useEffect(() => {
    const loadSessionData = async () => {
      try {
        const result = await window.electronAPI.getCurrentSession()
        if (result.success && result.data && result.data.notes) {
          setNotes(result.data.notes)
        }
      } catch (error) {
        console.error('Error loading session data:', error)
      }
    }

    loadSessionData()
    
    // Listen for custom events when memory is updated
    const handleMemoryUpdate = () => loadSessionData()
    window.addEventListener('memoryUpdated', handleMemoryUpdate)

    return () => {
      window.removeEventListener('memoryUpdated', handleMemoryUpdate)
    }
  }, [])

  const defaultPosition = {
    x: window.innerWidth - 420, // Positioned on the top right (accounting for wider component)
    y: 90 // Parallel to the suggestion area
  }

  const handleEditClick = useCallback(() => {
    if (isEditMode) return
    setIsEditing(true)
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 0)
  }, [isEditMode])

  const handleSaveNotes = useCallback(async () => {
    if (!notes.trim()) return

    setIsSaving(true)
    try {
      await window.electronAPI.updateSessionNotes(notes)
      setIsEditing(false)
      window.dispatchEvent(new CustomEvent('memoryUpdated'))
    } catch (error) {
      console.error('Error saving notes:', error)
    } finally {
      setIsSaving(false)
    }
  }, [notes])

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false)
    // Reload original notes
    const loadSessionData = async () => {
      try {
        const result = await window.electronAPI.getCurrentSession()
        if (result.success && result.data && result.data.notes) {
          setNotes(result.data.notes)
        }
      } catch (error) {
        console.error('Error loading session data:', error)
      }
    }
    loadSessionData()
  }, [])

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.name.match(/\.(txt|md|rtf)$/i)) {
      alert('Please upload a text file (.txt, .md, or .rtf)')
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        if (content) {
          setNotes(content)
        }
      }
      reader.readAsText(file)
    } catch (error) {
      console.error('Error reading file:', error)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setNotes(text)
      }
    } catch (error) {
      console.error('Error reading clipboard:', error)
    }
  }, [])

  const handleTextSelection = useCallback(
    (e: React.MouseEvent) => {
      if (isEditMode || isEditing) return

      const selection = window.getSelection()
      const selectedText = selection?.toString()

      if (selectedText && selectedText.trim().length > 0) {
        e.stopPropagation()
        setInput(selectedText.trim())
      }
    },
    [isEditMode, isEditing, setInput]
  )

  return (
    <DraggableComponent
      id="notes-component"
      isEditMode={isEditMode}
      position={position}
      onPositionChange={onPositionChange}
      defaultPosition={defaultPosition}
      width={400} // Wider for better note viewing
      height={450} // Taller for more content
      onClick={() => {}}
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
      {/* Header with action buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '8px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#ffffff',
          margin: 0
        }}>
          📝 Meeting Notes
        </h3>
        
        {!isEditing && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={handleEditClick}
              style={{
                background: 'rgba(88, 101, 242, 0.8)',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '10px',
                padding: '4px 6px',
                cursor: 'pointer'
              }}
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Action buttons for empty state */}
      {!notes && !isEditing && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.rtf"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px dashed rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '12px',
              padding: '8px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            📁 Upload Notes File (.txt, .md, .rtf)
          </button>
          <button
            onClick={handlePaste}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '12px',
              padding: '8px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            📋 Paste from Clipboard
          </button>
        </div>
      )}

      {/* Notes content */}
      {isEditing ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter your meeting notes, agenda, or key points..."
            style={{
              flex: 1,
              minHeight: '150px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              padding: '8px',
              color: 'white',
              fontSize: '12px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleSaveNotes}
              disabled={isSaving}
              style={{
                background: 'rgba(34, 197, 94, 0.8)',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '11px',
                padding: '6px 12px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.6 : 1
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancelEdit}
              style={{
                background: 'rgba(239, 68, 68, 0.8)',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '11px',
                padding: '6px 12px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : notes ? (
        <div 
          style={{ 
            flex: 1,
            whiteSpace: 'pre-wrap', 
            lineHeight: '1.5', 
            color: '#dcddde',
            fontSize: '12px',
            overflow: 'auto',
            userSelect: 'text',
            cursor: 'text'
          }}
          onClick={handleTextSelection}
        >
          {notes}
        </div>
      ) : (
        <div style={{ 
          color: 'rgba(255, 255, 255, 0.5)', 
          fontSize: '12px', 
          textAlign: 'center',
          padding: '20px',
          fontStyle: 'italic',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          No notes yet. Upload a file or paste content to get started.
        </div>
      )}
    </DraggableComponent>
  )
}

export default NotesComponent
