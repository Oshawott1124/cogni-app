import { useEffect, useState } from 'react'

interface OverlayIndicatorProps {
  isOverlayMode: boolean
}

const OverlayIndicator: React.FC<OverlayIndicatorProps> = ({ isOverlayMode }) => {
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    // Notify main process about content state
    window.electronAPI.setHasContent(!isOverlayMode)
  }, [isOverlayMode])

  if (!isOverlayMode) {
    return null
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div
        className="w-8 h-8 bg-blue-500/80 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600/80 transition-colors"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => window.electronAPI.toggleOverlayMode()}
      >
        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
      </div>
      
      {showTooltip && (
        <div className="absolute top-full mt-2 px-2 py-1 bg-black/90 text-white text-xs rounded whitespace-nowrap">
          Click to expand • Shift+Tab to toggle
        </div>
      )}
    </div>
  )
}

export default OverlayIndicator
