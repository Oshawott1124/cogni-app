import { Button } from './ui/button'

interface WelcomeScreenProps {
  onOpenSettings: () => void
  onStartSession: () => void
  hasApiKey: boolean
}

export const WelcomeScreen = ({ 
  onOpenSettings, 
  onStartSession, 
  hasApiKey 
}: WelcomeScreenProps): React.JSX.Element => {
  return (
    <div className="min-h-screen w-full bg-black/5 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6 w-full max-w-xl">

        {/* Logo Badge */}
        <div className="px-5 py-1 bg-white/10 border border-white/20 text-white/80 text-sm rounded-full shadow-sm backdrop-blur-sm font-medium tracking-wide">
         cogni
        </div>

        {/* Main Card */}
        <div className="w-full backdrop-blur-md bg-black/80 border border-white/20 rounded-2xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
            Welcome Back
          </h1>

          <p className="text-white/70 text-sm mb-6">
            Ready to start a new session? Your AI-powered overlay assistant is here to help.
          </p>

          {/* API Key Status */}
          <div className={`border rounded-xl p-4 mb-6 ${
            hasApiKey 
              ? 'bg-green-500/10 border-green-500/20' 
              : 'bg-yellow-500/10 border-yellow-500/20'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${
                hasApiKey ? 'bg-green-400' : 'bg-yellow-400'
              }`} />
              <span className="text-white font-medium text-sm">
                {hasApiKey ? 'API Key Configured' : 'API Key Required'}
              </span>
            </div>
            <p className="text-white/70 text-xs">
              {hasApiKey 
                ? 'Your AI assistant is ready to help you with context-aware suggestions.'
                : 'Configure your API key to enable AI-powered assistance.'
              }
            </p>
          </div>



          <div className="bg-black/30 border border-white/20 rounded-xl p-5 mb-6">
            <h3 className="text-white font-semibold mb-3 text-base">⚡ Quick Actions</h3>
            <div className="space-y-3">
              {hasApiKey ? (
                <Button
                  onClick={onStartSession}
                  className="w-full py-3 px-4 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-colors"
                >
                  Start New Session
                </Button>
              ) : (
                <Button
                  onClick={onOpenSettings}
                  className="w-full py-3 px-4 bg-yellow-500 text-black font-semibold rounded-xl hover:bg-yellow-400 transition-colors"
                >
                  Configure API Key
                </Button>
              )}
              
              <Button
                onClick={onOpenSettings}
                variant="outline"
                className="w-full py-2 px-4 border-white/20 text-white hover:bg-white/10 transition-colors"
              >
                Settings
              </Button>
            </div>
          </div>

          <div className="bg-black/30 border border-white/20 rounded-xl p-5 mb-6">
            <h3 className="text-white font-semibold mb-3 text-base">🛠 Global Shortcuts</h3>
            <ul className="space-y-2 text-sm text-white/80">
              {[
                ['Toggle Overlay', 'Shift+Tab'],
                ['Take Screenshot', 'Ctrl+H / Cmd+H'],
                ['Toggle Edit Mode', 'Shift+Tab'],
                ['Exit Edit Mode', 'ESC'],
              ].map(([label, shortcut], index) => (
                <li key={index} className="flex justify-between border-b border-white/10 pb-1 last:border-b-0">
                  <span>{label}</span>
                  <span className="font-mono text-white/90">{shortcut}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-center text-white/40 mt-4">
            Tip: Once you start a session, the overlay will appear on your screen. Use <span className="font-mono text-white/60">Shift+Tab</span> to enter edit mode and customize the layout.
          </p>
        </div>
      </div>
    </div>
  )
}
