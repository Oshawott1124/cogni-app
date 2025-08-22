import { Button } from './ui/button'

interface WelcomeScreenProps {
  onOpenSettings: () => void
}

export const WelcomeScreen = ({ onOpenSettings }: WelcomeScreenProps): React.JSX.Element => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#141414] flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6 w-full max-w-xl">

        {/* Logo Badge */}
        <div className="px-5 py-1 bg-white/10 border border-white/20 text-white/80 text-sm rounded-full shadow-sm backdrop-blur-sm font-medium tracking-wide">
          clueless
        </div>

        {/* Main Card */}
        <div className="w-full backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
          <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
            F*ck Leetcode
          </h1>

          <p className="text-white/70 text-sm mb-6">
            An undetectable AI that helps you silently ace technical interviews.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
            <h3 className="text-white font-semibold mb-3 text-base">⚡ Global Shortcuts</h3>
            <ul className="space-y-2 text-sm text-white/80">
              {[
                ['Toggle Visibility', 'Ctrl+B / Cmd+B'],
                ['Take Screenshot', 'Ctrl+H / Cmd+H'],
                ['Delete Last Screenshot', 'Ctrl+L / Cmd+L'],
                ['Process Screenshot', 'Ctrl+Enter / Cmd+Enter'],
                ['Reset View', 'Ctrl+R / Cmd+R'],
                ['Quit App', 'Ctrl+Q / Cmd+Q'],
              ].map(([label, shortcut], index) => (
                <li key={index} className="flex justify-between border-b border-white/10 pb-1 last:border-b-0">
                  <span>{label}</span>
                  <span className="font-mono text-white/90">{shortcut}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
            <h3 className="text-white font-semibold mb-3 text-base">🛠 Get Started</h3>
            <p className="text-white/70 text-sm mb-4">
              Before you start silently destroying coding rounds, plug in your API key and you're good to go.
            </p>
            <Button
              onClick={onOpenSettings}
              className="w-full py-3 px-4 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-colors"
            >
              Open Settings
            </Button>
          </div>

          <p className="text-xs text-center text-white/40 mt-4">
            Hint: Use <span className="font-mono text-white/60">Ctrl+H</span> to grab screenshots and let the AI do the heavy lifting.
          </p>
        </div>
      </div>
    </div>
  )
}
