import { useEffect, useRef, useState, useCallback } from 'react'

interface ComponentPosition {
  x: number
  y: number
}

interface DraggableComponentProps {
  id: string
  isEditMode: boolean
  position?: ComponentPosition
  onPositionChange: (position: ComponentPosition) => void
  defaultPosition: ComponentPosition
  width: number
  height: number
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
  onClick?: () => void
  zIndex?: number
}

const DraggableComponent: React.FC<DraggableComponentProps> = ({
  id,
  isEditMode,
  position,
  onPositionChange,
  defaultPosition,
  width,
  height,
  className = '',
  style = {},
  children,
  onClick,
  zIndex = 10
}) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [currentPosition, setCurrentPosition] = useState(position || defaultPosition)

  // Update position when prop changes
  useEffect(() => {
    if (position) {
      setCurrentPosition(position)
    }
  }, [position])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isEditMode) {
      // In overlay mode, handle click
      onClick?.()
      return
    }

    // In edit mode, start dragging
    e.preventDefault()
    e.stopPropagation()

    const rect = elementRef.current?.getBoundingClientRect()
    if (!rect) return

    setIsDragging(true)
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }, [isEditMode, onClick])

  // Handle mouse enter/leave for dynamic click-through
  const handleMouseEnter = useCallback(() => {
    if (!isEditMode) {
      // Make window interactive when hovering over component
      window.electronAPI?.setMouseIgnore(false)
    }
  }, [isEditMode])

  const handleMouseLeave = useCallback(() => {
    if (!isEditMode) {
      // Make window click-through when leaving component
      window.electronAPI?.setMouseIgnore(true)
    }
  }, [isEditMode])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !isEditMode) return

    const x = e.clientX - dragOffset.x
    const y = e.clientY - dragOffset.y

    // Keep component within window bounds
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    
    const boundedX = Math.max(0, Math.min(x, windowWidth - width))
    const boundedY = Math.max(0, Math.min(y, windowHeight - height))

    const newPosition = { x: boundedX, y: boundedY }
    setCurrentPosition(newPosition)
    onPositionChange(newPosition)
  }, [isDragging, isEditMode, dragOffset, width, height, onPositionChange])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Global mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const componentStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${currentPosition.x}px`,
    top: `${currentPosition.y}px`,
    width: `${width}px`,
    height: `${height}px`,
    background: 'rgba(54, 57, 63, 0.95)', // Default background (can be overridden)
    border: isEditMode ? `2px solid #5865f2` : 'none', // Only show border in edit mode
    borderRadius: '8px', // Default border radius (can be overridden)
    padding: '16px', // Default padding (can be overridden)
    color: '#dcddde',
    fontSize: '14px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: isEditMode ? 'move' : 'pointer',
    transition: isDragging ? 'none' : 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
    boxShadow: isDragging 
      ? '0 8px 25px rgba(88, 101, 242, 0.4)' 
      : isEditMode 
        ? '0 4px 12px rgba(88, 101, 242, 0.2)'
        : '0 4px 12px rgba(0, 0, 0, 0.3)',
    transform: isDragging ? 'rotate(2deg) scale(1.05)' : 'none',
    zIndex: isDragging ? 1000 : zIndex,
    pointerEvents: 'auto', // Components are always interactive
    ...style // Style overrides applied last
  }

  return (
    <div
      ref={elementRef}
      className={`overlay-component ${className} ${isDragging ? 'dragging' : ''} ${isEditMode ? 'edit-mode' : ''}`}
      style={componentStyle}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-component={id}
    >
      {children}
    </div>
  )
}

export default DraggableComponent
