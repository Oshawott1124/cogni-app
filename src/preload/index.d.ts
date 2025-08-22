export interface ElectronAPI {
  getConfig: () => Promise<{
    apiKey?: string
    apiProvider?: 'openai' | 'gemini'
    extractionModel?: string
    solutionModel?: string
    debuggingModel?: string
    language?: string
  }>
  updateConfig: (config: {
    apiKey?: string
    apiProvider?: 'openai' | 'gemini'
    extractionModel?: string
    solutionModel?: string
    debuggingModel?: string
    language?: string
  }) => Promise<boolean>
  checkApiKey: () => Promise<boolean>
  validateApiKey: (apiKey: string) => Promise<{
    valid: boolean
    error?: string
  }>
  onApiKeyInvalid: (callback: () => void) => () => void
  getScreenshots: () => Promise<{ path: string; preview: string }[]>
  deleteScreenshot: (path: string) => Promise<{ success: boolean; error?: string }>
  onScreenshotTaken: (callback: (data: { path: string; preview: string }) => void) => () => void
  toggleMainWindow: () => Promise<{ success: boolean; error?: string }>
  getPlatform: () => string
  triggerScreenshot: () => Promise<{ success: boolean; error?: string }>
  deleteLastScreenshot: () => Promise<{ success: boolean; error?: string }>
  openSettingsPortal: () => Promise<{ success: boolean; error?: string }>
  onDeleteLastScreenshot: (callback: () => void) => () => void
  onShowSettings: (callback: () => void) => () => void
  triggerProcessScreenshots: () => Promise<{ success: boolean; error?: string }>
  onSolutionStart: (callback: () => void) => () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSolutionSuccess: (callback: (data: any) => void) => () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onProblemExtracted: (callback: (data: any) => void) => () => void
  onResetView: (callback: () => void) => () => void
  triggerReset: () => Promise<{ success: boolean; error?: string }>
  onDebugStart: (callback: () => void) => () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDebugSuccess: (callback: (data: any) => void) => () => void
  onDebugError: (callback: (error: string) => void) => () => void
  onProcessingNoScreenshots: (callback: () => void) => () => void
  onSolutionError: (callback: (error: string) => void) => () => void
  updateContentDimensions: (dimensions: { width: number; height: number }) => void
  openLink: (url: string) => Promise<{ success: boolean; error?: string }>
  
  // New: Discord-like overlay mode functionality
  toggleOverlayMode: () => Promise<{ success: boolean; error?: string }>
  setHasContent: (hasContent: boolean) => Promise<{ success: boolean; error?: string }>
  setMouseIgnore: (ignore: boolean) => Promise<{ success: boolean; error?: string }>
  onOverlayModeChanged: (callback: (isOverlayMode: boolean) => void) => () => void
  onEditModeChanged: (callback: (isEditMode: boolean) => void) => () => void
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeListener: (eventName: string, callback: (...args: any[]) => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
    __LANGUAGE__: string
    __IS_INITIALIZED__: boolean
  }
}