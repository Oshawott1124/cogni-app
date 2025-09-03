import { useCallback, useState, useEffect, useRef, memo } from 'react'
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

const NotesComponent: React.FC<NotesComponentProps> = memo(function NotesComponent({
  isEditMode,
  position,
  onPositionChange,
  onMouseEnter,
  onMouseLeave
}: NotesComponentProps) {
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
    x: window.innerWidth - 520, // Positioned on the top right (accounting for larger component)
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

        // Enhanced: Add context about what was selected
        const contextualInput = `From meeting notes: "${selectedText.trim()}"\n\nPlease help me with this:`
        setInput(contextualInput)

        // Clear selection after use
        selection?.removeAllRanges()
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
      width={500} // Much wider for better note viewing
      height={600} // Much taller for more content
      onClick={() => {}}
      zIndex={8}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: 'rgba(12, 13, 13, 0.7)', // Notion-style subtle background
        borderColor: 'rgba(255, 255, 255, 0.06)', // Minimal border
        padding: '20px',
        fontSize: '14px',
        textAlign: 'left',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '16px',
        overflowY: 'auto'
      }}
    >
      {/* Header with action buttons - Notion-style */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span style={{ fontSize: '11px' }}>📝</span>
          </div>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#e1e5e9',
              letterSpacing: '-0.01em'
            }}
          >
            Meeting Notes
          </span>
        </div>

        {!isEditing && notes && (
          <button
            onClick={handleEditClick}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '5px',
              color: '#e1e5e9',
              fontSize: '12px',
              fontWeight: 500,
              padding: '6px 12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              letterSpacing: '-0.01em'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
            }}
          >
            Edit
          </button>
        )}
      </div>

      {/* Action buttons for empty state - Notion-style */}
      {!notes && !isEditing && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '16px'
          }}
        >
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
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px dashed rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '13px',
              fontWeight: 400,
              padding: '14px 16px',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.15s ease',
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
            }}
          >
            Upload Notes File (.txt, .md, .rtf)
          </button>
          <button
            onClick={handlePaste}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '5px',
              color: '#e1e5e9',
              fontSize: '12px',
              fontWeight: 500,
              padding: '8px 16px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
            }}
          >
            Paste from Clipboard
          </button>
        </div>
      )}

      {/* Notes content - Notion-style */}
      {isEditing ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter your meeting notes, agenda, or key points..."
            style={{
              flex: 1,
              minHeight: '200px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              padding: '16px',
              color: '#e1e5e9',
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: '1.6',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'all 0.15s ease',
              letterSpacing: '-0.01em'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
            }}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleCancelEdit}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '5px',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '12px',
                fontWeight: 500,
                padding: '8px 16px',
                cursor: 'pointer',
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
              Cancel
            </button>
            <button
              onClick={handleSaveNotes}
              disabled={isSaving}
              style={{
                background: isSaving ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '5px',
                color: isSaving ? 'rgba(255, 255, 255, 0.3)' : '#e1e5e9',
                fontSize: '12px',
                fontWeight: 500,
                padding: '8px 16px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                letterSpacing: '-0.01em'
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                }
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : notes ? (
        <div
          style={{
            flex: 1,
            whiteSpace: 'pre-wrap',
            lineHeight: '1.6',
            color: '#e1e5e9',
            fontSize: '14px',
            fontWeight: 400,
            overflow: 'auto',
            userSelect: 'text',
            cursor: 'text',
            letterSpacing: '-0.01em',
            background: 'rgba(255, 255, 255, 0.01)',
            borderRadius: '6px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            transition: 'all 0.15s ease'
          }}
          onClick={handleTextSelection}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)'
          }}
        >
          {notes}
        </div>
      ) : (
        <div
          style={{
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '14px',
            fontWeight: 400,
            textAlign: 'center',
            padding: '32px 20px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            letterSpacing: '-0.01em'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '8px'
            }}
          >
            <span style={{ fontSize: '20px', opacity: 0.6 }}>📝</span>
          </div>
          <p style={{ margin: 0, lineHeight: '1.4', fontSize: '15px', fontWeight: 500 }}>
            No notes yet
          </p>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.6, lineHeight: '1.4' }}>
            Upload a file or paste content to get started with your meeting notes.
          </p>
        </div>
      )}
    </DraggableComponent>
  )
})

export default NotesComponent
