import { useState, useCallback, useRef, useEffect } from 'react'
import DraggableComponent from './draggable-component'
import { 
  Mic, 
  Monitor, 
  X,
  Database
} from 'lucide-react'
import { COMMAND_KEY } from '@renderer/lib/utils'

interface MemoryData {
  notes: string
  uploadedFiles: File[]
}

interface ComponentPosition {
  x: number
  y: number
}

interface ControlBarProps {
  isEditMode: boolean
  position?: ComponentPosition
  onPositionChange: (position: ComponentPosition) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

const ControlBar: React.FC<ControlBarProps> = ({
  isEditMode,
  position,
  onPositionChange,
  onMouseEnter,
  onMouseLeave
}) => {
  const [isMuted, setIsMuted] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isMemoryDropdownOpen, setIsMemoryDropdownOpen] = useState(false)
  const [memoryData, setMemoryData] = useState<MemoryData>({ notes: '', uploadedFiles: [] })

  // Load existing session data on mount
  useEffect(() => {
    const loadSessionData = async () => {
      try {
        const result = await window.electronAPI.getCurrentSession()
        if (result.success && result.data) {
          setMemoryData({
            notes: result.data.notes || '',
            uploadedFiles: result.data.uploadedFiles?.map((file: any) => ({
              name: file.name,
              path: file.path
            })) || []
          })
        }
      } catch (error) {
        console.error('Error loading session data:', error)
      }
    }
    
    loadSessionData()
  }, [])

  const defaultPosition = {
    x: window.innerWidth / 2 - 200, // Center horizontally for wider control bar
    y: 20 // Top margin
  }

  const handleMicClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isEditMode) return
    setIsMuted(!isMuted)
    console.log('Microphone toggled:', isMuted ? 'unmuted' : 'muted')
  }


  const handleScreenShareClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isEditMode) return
    setIsScreenSharing(!isScreenSharing)
    console.log('Screen sharing toggled:', isScreenSharing ? 'stopped' : 'started')
  }


  const handleCloseClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isEditMode) return
    console.log('Closing overlay...')
    
    try {
      // Hide the main window (close overlay)
      await window.electronAPI.toggleMainWindow()
    } catch (error) {
      console.error('Failed to close overlay:', error)
    }
  }

  const handleMemoryClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isEditMode) return
    setIsMemoryDropdownOpen(!isMemoryDropdownOpen)
  }

  const handleNotesChange = useCallback(async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value
    const updatedData = { ...memoryData, notes: newNotes }
    setMemoryData(updatedData)
    
    try {
      await window.electronAPI.updateSessionNotes(newNotes)
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('memoryUpdated'))
    } catch (error) {
      console.error('Error updating session notes:', error)
    }
  }, [memoryData])

  const handleFileUpload = useCallback(async () => {
    try {
      const result = await window.electronAPI.uploadSessionFile()
      if (result.success && result.files) {
        const newFiles = result.files.map((file: any) => ({
          name: file.name,
          path: file.path
        }))
        
        const updatedData = { 
          ...memoryData, 
          uploadedFiles: [...memoryData.uploadedFiles, ...newFiles]
        }
        setMemoryData(updatedData)
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('memoryUpdated'))
      }
    } catch (error) {
      console.error('Error uploading files:', error)
    }
  }, [memoryData])

  const removeFile = useCallback(async (index: number) => {
    const fileToRemove = memoryData.uploadedFiles[index]
    if (!fileToRemove) return
    
    try {
      await window.electronAPI.removeSessionFile(fileToRemove.name)
      
      const updatedData = {
        ...memoryData,
        uploadedFiles: memoryData.uploadedFiles.filter((_, i) => i !== index)
      }
      setMemoryData(updatedData)
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('memoryUpdated'))
    } catch (error) {
      console.error('Error removing file:', error)
    }
  }, [memoryData])

  return (
    <DraggableComponent
      id="control-bar"
      isEditMode={isEditMode}
      position={position}
      onPositionChange={onPositionChange}
      defaultPosition={defaultPosition}
      width={460}
      height={56}
      zIndex={10}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: 'rgba(12, 13, 13, 0.6)',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(20px)',
        padding: '12px 16px',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      {/* Main Control Buttons Row */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        width: 'auto',
        height: '44px',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}>

        {/* Grouped Control Buttons Container */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(40, 42, 46, 0.8)',
          borderRadius: '12px',
          padding: '6px 12px'
        }}>
          {/* Microphone Button Group */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <button
              onClick={handleMicClick}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: 'none',
                background: isMuted ? 'rgba(224, 217, 217, 0.8)' : 'rgba(47, 50, 56, 0.1)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isEditMode ? 'default' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Mic size={18} />
            </button>
            <div className="flex gap-1">
              <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                {COMMAND_KEY}
              </button>
              <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                H
              </button>
            </div>
          </div>

          {/* Screen Share Button Group */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <button
              onClick={handleScreenShareClick}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: 'none',
                background: isScreenSharing ? 'rgba(224, 217, 217, 0.8)' : 'rgba(47, 50, 56, 0.1)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isEditMode ? 'default' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Monitor size={18} />
            </button>
            <div className="flex gap-1">
              <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                {COMMAND_KEY}
              </button>
              <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                H
              </button>
            </div>
          </div>
        </div>

        {/* Memory/Database Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={handleMemoryClick}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              border: 'none',
              background: isMemoryDropdownOpen ? 'rgba(88, 101, 242, 0.8)' : 'rgba(47, 50, 56, 0.8)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isEditMode ? 'default' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Database size={18} />
          </button>

          {/* Memory Dropdown */}
          {isMemoryDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '50px',
              right: '0',
              width: '320px',
              maxHeight: '400px',
              background: 'rgba(30, 31, 34, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '16px',
              zIndex: 1000,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <h3 style={{ 
                color: 'white', 
                fontSize: '16px', 
                fontWeight: 600, 
                marginBottom: '12px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: '8px'
              }}>
                 Session Memory
              </h3>

              {/* File Upload Section */}
              <div>
                <label style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  display: 'block', 
                  marginBottom: '8px' 
                }}>
                  Relevant Documents
                </label>
                
                <button
                  onClick={handleFileUpload}
                  style={{
                    width: '100%',
                    height: '36px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px dashed rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '8px'
                  }}
                >
                  📎 Upload files (PDF, DOC, TXT, MD)
                </button>

                {/* Uploaded Files List */}
                {memoryData.uploadedFiles.length > 0 && (
                  <div style={{ 
                    maxHeight: '100px', 
                    overflowY: 'auto',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '4px'
                  }}>
                    {memoryData.uploadedFiles.map((file, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        marginBottom: '2px'
                      }}>
                        <span style={{ 
                          color: 'rgba(255, 255, 255, 0.8)', 
                          fontSize: '11px',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {file.name}
                        </span>
                        <button
                          onClick={() => removeFile(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(239, 68, 68, 0.8)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '0 4px'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleCloseClick}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            border: 'none',
            background: 'rgba(88, 101, 242, 0.7)',
            color: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isEditMode ? 'default' : 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!isEditMode) {
              e.currentTarget.style.background = 'rgba(88, 101, 242, 0.8)'
              e.currentTarget.style.color = 'white'
            }
          }}
          onMouseLeave={(e) => {
            if (!isEditMode) {
              e.currentTarget.style.background = 'rgba(88, 101, 242, 0.7)'
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
            }
          }}
        >
          <X size={18} />
        </button>

      </div>
    </DraggableComponent>
  )
}

export default ControlBar
