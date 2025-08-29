import { useState } from 'react'
import DraggableComponent from './draggable-component'
import { 
  Mic, 
  MicOff, 
  Headphones, 
  Monitor, 
  Phone, 
  PhoneOff, 
  CircleX
} from 'lucide-react'
import { COMMAND_KEY } from '@renderer/lib/utils'

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
  const [isListening, setIsListening] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)

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


  const handleHangupClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isEditMode) return
    console.log('Hangup clicked')
    // Handle disconnect/hangup
  }

  return (
    <DraggableComponent
      id="control-bar"
      isEditMode={isEditMode}
      position={position}
      onPositionChange={onPositionChange}
      defaultPosition={defaultPosition}
      width={400}
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

        {/* Hangup Button */}
        <button
          onClick={handleHangupClick}
          style={{
            width: '60px',
            height: '44px',
            borderRadius: '8px',
            border: 'none',
            background: 'rgba(236, 34, 37, 0.8)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isEditMode ? 'default' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <CircleX size={20} />
        </button>

      </div>
    </DraggableComponent>
  )
}

export default ControlBar
