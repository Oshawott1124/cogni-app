import { QueryProvider } from './providers/query-provider'
import { WelcomeScreen } from './components/welcome-screen'
import { useCallback, useEffect, useState } from 'react'
import SettingsDialog from './components/settings-dailogue'
import OverlayContainer from './components/overlay-container'
import { ToastContext } from '@renderer/providers/toast-context'
import {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastDescription,
  ToastTitle
} from './components/ui/toast'



function App(): React.JSX.Element {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [toastState, setToastState] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'neutral' as 'neutral' | 'success' | 'error'
  })

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true)
  }, [])

  const handleCloseSettings = useCallback((open: boolean) => {
    setIsSettingsOpen(open)
  }, [])

  const markInitialized = useCallback(() => {
    setIsInitialized(true)
    window.__IS_INITIALIZED__ = true
  }, [])

  const showToast = useCallback(
    (title: string, description: string, variant: 'neutral' | 'success' | 'error') => {
      setToastState({
        open: true,
        title,
        description,
        variant
      })
    },
    []
  )

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const hasKey = await window.electronAPI.checkApiKey()
        setHasApiKey(hasKey)
      } catch (error) {
        console.error('Error checking API key:', error)
        showToast('Error checking API key', 'Please check your API key', 'error')
      }
    }

    if (isInitialized) {
      checkApiKey()
    }
  }, [isInitialized, showToast])

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await window.electronAPI.getConfig()
        markInitialized()
      } catch (error) {
        console.error('Error initializing app:', error)
        markInitialized()
      }
    }
    initializeApp()

    const onApiKeyInvalid = () => {
      showToast('API key invalid', 'Please check your API key', 'error')
    }

    window.electronAPI.onApiKeyInvalid(onApiKeyInvalid)

    return () => {
      window.electronAPI.removeListener('API_KEY_INVALID', onApiKeyInvalid)
      window.__IS_INITIALIZED__ = false
      setIsInitialized(false)
    }
  }, [markInitialized, showToast])

  const handleStartSession = useCallback(async () => {
    try {
      const result = await window.electronAPI.createNewSession()
      if (result.success) {
        setSessionStarted(true)
        showToast('Session Started', `New session created: ${result.sessionId}`, 'success')
        console.log('New session created:', result.sessionId)
      } else {
        showToast('Error', 'Failed to create new session', 'error')
      }
    } catch (error) {
      console.error('Error creating new session:', error)
      showToast('Error', 'Failed to create new session', 'error')
    }
  }, [showToast])

  // Ensure window is interactive when showing welcome screen
  useEffect(() => {
    if (isInitialized && !sessionStarted) {
      // When showing welcome screen, always make window interactive
      window.electronAPI.setMouseIgnore(false)
    }
  }, [isInitialized, sessionStarted])

  useEffect(() => {
    const unsubscribeSettings = window.electronAPI.onShowSettings(() => {
      // Ensure window is interactive when settings dialog opens
      window.electronAPI.setMouseIgnore(false)
      setIsSettingsOpen(true)
    })

    return () => {
      unsubscribeSettings()
    }
  }, [])

  return (
    <QueryProvider>
      <ToastProvider>
        <ToastContext.Provider value={{ showToast }}>
          <div className="relative w-screen h-screen bg-transparent overflow-hidden">
            {isInitialized ? (
              sessionStarted ? (
                // Show overlay container when session is started
                <OverlayContainer />
              ) : (
                // Always show welcome screen first, regardless of API key status
                <WelcomeScreen 
                  onOpenSettings={handleOpenSettings} 
                  onStartSession={handleStartSession}
                  hasApiKey={hasApiKey}
                />
              )
            ) : (
              <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
                  <p className="text-white/60 text-sm">Initializing...</p>
                </div>
              </div>
            )}
          </div>
          <SettingsDialog open={isSettingsOpen} onOpenChange={handleCloseSettings} />
          <Toast
            open={toastState.open}
            onOpenChange={(open) => setToastState((prev) => ({ ...prev, open }))}
            variant={toastState.variant}
            duration={1500}
          >
            <ToastTitle>{toastState.title}</ToastTitle>
            <ToastDescription>{toastState.description}</ToastDescription>
          </Toast>
          <ToastViewport />
        </ToastContext.Provider>
      </ToastProvider>
    </QueryProvider>
  )
}

export default App