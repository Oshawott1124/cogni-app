import { useEffect, useState } from 'react'
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  Dialog,
  DialogDescription,
  DialogFooter
} from './ui/dailog' // Corrected spelling here
import { Input } from './ui/input'
import { Button } from './ui/button'
import { useToast } from '@renderer/providers/toast-context'

type APIProvider = 'openai' | 'gemini'

type AIModel = {
  id: string
  name: string
  description: string
}

type ModelCategory = {
  key: 'extractionModel' | 'solutionModel' | 'debuggingModel'
  title: string
  description: string
  openaiModels: AIModel[]
  geminiModels: AIModel[]
}

const modelCategories: ModelCategory[] = [
  {
    key: 'extractionModel',
    title: 'Problem Extraction',
    description: 'Model used to analyze the screenshots and extract the problem statement',
    openaiModels: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Best overall performance for problem extraction'
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Faster, more cost-effective model for problem extraction'
      }
    ],
    geminiModels: [
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Best overall performance for problem extraction'
      },
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        description: 'Faster, more cost-effective model for problem extraction'
      }
    ]
  },
  {
    key: 'solutionModel',
    title: 'Solution Generation',
    description: 'Model used to generate the solution to the problem',
    openaiModels: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Best overall performance for solution generation'
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Faster, more cost-effective model for solution generation'
      }
    ],
    geminiModels: [
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Best overall performance for solution generation'
      },
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        description: 'Faster, more cost-effective model for solution generation'
      }
    ]
  },
  {
    key: 'debuggingModel',
    title: 'Debugging',
    description: 'Model used to debug the solution',
    openaiModels: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Best overall performance for debugging'
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Faster, more cost-effective model for debugging'
      }
    ],
    geminiModels: [
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Best overall performance for debugging'
      },
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        description: 'Faster, more cost-effective model for debugging'
      }
    ]
  }
]

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function SettingsDialog({ open: openProp, onOpenChange }: SettingsDialogProps) {
  const [open, setOpen] = useState(openProp)
  const [apiKey, setApiKey] = useState('')
  const [apiProvider, setApiProvider] = useState<APIProvider>('openai')
  const [extractionModel, setExtractionModel] = useState('gpt-4o')
  const [solutionModel, setSolutionModel] = useState('gpt-4o')
  const [debuggingModel, setDebuggingModel] = useState('gpt-4o')
  const [isLoading, setIsLoading] = useState(false)

  const { showToast } = useToast()

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (onOpenChange && newOpen !== openProp) {
      onOpenChange(newOpen)
    }
  }

  useEffect(() => {
    setOpen(openProp)
  }, [openProp])

  const maskApiKey = (key: string) =>
    key ? `${key.slice(0, 4)}....${key.slice(-4)}` : ''

  const handleProviderChange = (provider: APIProvider) => {
    setApiProvider(provider)
    const modelId = provider === 'openai' ? 'gpt-4o' : 'gemini-1.5-pro'
    setExtractionModel(modelId)
    setSolutionModel(modelId)
    setDebuggingModel(modelId)
  }

  const handleSave = async () => {
    if (!window.electronAPI) {
      console.error('Electron API not found')
      showToast('Error', 'Electron API is not available', 'error')
      return
    }

    setIsLoading(true)
    try {
      const result = await window.electronAPI.updateConfig({
        apiKey,
        apiProvider,
        extractionModel,
        solutionModel,
        debuggingModel
      })

      if (result) {
        showToast('Success', 'Settings saved successfully', 'success')
        handleOpenChange(false)
        setTimeout(() => window.location.reload(), 1500)
      }
    } catch (err) {
      console.error('Failed to save settings:', err)
      showToast('Error', 'Failed to save settings', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const openExternalLink = (url: string) => {
    if (!window.electronAPI) return
    window.electronAPI.openLink(url)
  }

  useEffect(() => {
    if (!open || !window.electronAPI) return

    setIsLoading(true)
    window.electronAPI
      .getConfig()
      .then((config) => {
        setApiKey(config.apiKey || '')
        setApiProvider(config.apiProvider || 'openai')
        setExtractionModel(config.extractionModel || 'gpt-4o')
        setSolutionModel(config.solutionModel || 'gpt-4o')
        setDebuggingModel(config.debuggingModel || 'gpt-4o')
      })
      .catch((err) => {
        console.error('Failed to load config:', err)
        showToast('Error', 'Failed to load settings', 'error')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [open, showToast])

  return (
     <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-neutral-900 border border-white/10 text-white p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold">API Settings</DialogTitle>
          <DialogDescription className="text-sm text-neutral-400">
            Configure your API key and model preferences. Your API key is stored locally.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">API Provider</label>
            <div className="flex gap-4">
              {['openai', 'gemini'].map((provider) => (
                <div
                  key={provider}
                  className={`flex-1 p-3 rounded-lg cursor-pointer text-sm text-white border transition-all duration-200 ${
                    apiProvider === provider ? 'bg-white/10 border-white/40' : 'bg-black/30 border-white/10 hover:bg-white/5'
                  }`}
                  onClick={() => handleProviderChange(provider as APIProvider)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        apiProvider === provider ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                    <div>
                      <div className="font-medium capitalize">{provider}</div>
                      <div className="text-xs text-white/60">
                        {provider === 'openai' ? 'GPT-4o models' : 'Gemini models'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div>
            <label htmlFor="apiKey" className="text-sm font-medium block mb-2">
              {apiProvider === 'openai' ? 'OpenAI API Key' : 'Google AI Studio API Key'}
            </label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              placeholder={apiProvider === 'openai' ? 'sk-...' : 'AIza...'}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-neutral-800 text-white border-white/10"
            />
            {apiKey && (
              <p className="text-xs text-white/50 mt-1">Current: {maskApiKey(apiKey)}</p>
            )}
            <p className="text-xs text-neutral-500 mt-2">
              Your API key is stored locally.{' '}
              <span className="underline cursor-pointer text-blue-400" onClick={() => openExternalLink(apiProvider === 'openai' ? 'https://platform.openai.com/account/api-keys' : 'https://aistudio.google.com/app/apikey')}>
                Get API Key
              </span>
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <label className="text-sm font-medium block mb-1">AI Model Selection</label>
            <p className="text-xs text-white/60 mb-3">
              Choose your model for each processing stage
            </p>
            {modelCategories.map((category) => {
              const models = apiProvider === 'openai' ? category.openaiModels : category.geminiModels
              const selectedModel = category.key === 'extractionModel' ? extractionModel : category.key === 'solutionModel' ? solutionModel : debuggingModel
              const setSelected = category.key === 'extractionModel' ? setExtractionModel : category.key === 'solutionModel' ? setSolutionModel : setDebuggingModel

              return (
                <div key={category.key} className="mb-4">
                  <p className="font-semibold text-sm mb-1">{category.title}</p>
                  <p className="text-xs text-white/60 mb-2">{category.description}</p>
                  <div className="grid gap-2">
                    {models.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setSelected(m.id)}
                        className={`p-2 rounded-lg cursor-pointer border text-sm ${
                          selectedModel === m.id ? 'bg-white/10 border-white/40' : 'bg-black/30 border-white/10 hover:bg-white/5'
                        }`}
                      >
                        <div className="font-medium text-white">{m.name}</div>
                        <p className="text-xs text-white/50">{m.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <DialogFooter className="mt-6 flex justify-between">
          <Button variant="outline" onClick={() => handleOpenChange(false)} className="text-white border-white/20 hover:bg-white/10">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !apiKey}
            className="bg-white text-black hover:bg-white/90 px-4 py-2 font-medium rounded-xl"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SettingsDialog
