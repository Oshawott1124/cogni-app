import { BrowserWindow, ipcMain, shell, dialog } from 'electron'
import { configManager } from './config-manager'
import { state } from '../index'
import { ProcessingManager } from './processing-manager'
import { sessionManager, SessionData } from './session-manager'
export interface IIPCHandler {
  getMainWindow: () => BrowserWindow | null
  takeScreenshot: () => Promise<string>
  getImagePreview: (filePath: string) => Promise<string>
  clearQueues: () => void
  setView: (view: 'queue' | 'solutions' | 'debug') => void
  getView: () => 'queue' | 'solutions' | 'debug'
  getScreenshotQueue: () => string[]
  getExtraScreenshotQueue: () => string[]
  moveWindowLeft: () => void
  moveWindowRight: () => void
  moveWindowUp: () => void
  moveWindowDown: () => void
  toggleMainWindow: () => void
  toggleOverlayMode: () => void // New: Discord-like overlay toggle
  isVisible: () => boolean
  deleteScreenshot: (path: string) => Promise<{ success: boolean; error?: string }>
  PROCESSING_EVENTS: typeof state.PROCESSING_EVENTS
  processingManager: ProcessingManager | null
  setWindowDimensions: (width: number, height: number) => void
  setHasContent: (hasContent: boolean) => void // New: content state management
  setMouseIgnore: (ignore: boolean) => void // New: dynamic click-through control
}

export function initializeIpcHandler(deps: IIPCHandler): void {
  ipcMain.handle('get-config', () => {
    return configManager.loadConfig()
  })

  ipcMain.handle('update-config', (_event, updates) => {
    return configManager.updateConfig(updates)
  })

  ipcMain.handle('check-api-key', () => {
    return configManager.hasApiKey()
  })

  ipcMain.handle('validate-api-key', async (_event, apiKey) => {
    if (!configManager.isValidApiKeyFormat(apiKey)) {
      return {
        valid: false,
        error: 'Invalid API key format'
      }
    }

    const result = await configManager.testApiKey(apiKey)
    return result
  })

  ipcMain.handle('get-screenshots', async () => {
    try {
      let previews: { path: string; preview: string }[] = []
      const currentView = deps.getView()
      console.log('currentView', currentView)

      if (currentView === 'queue') {
        const queue = deps.getScreenshotQueue()
        previews = await Promise.all(
          queue.map(async (path) => {
            const preview = await deps.getImagePreview(path)
            return { path, preview }
          })
        )
      } else {
        const queue = deps.getExtraScreenshotQueue()
        previews = await Promise.all(
          queue.map(async (path) => {
            const preview = await deps.getImagePreview(path)
            return { path, preview }
          })
        )
      }

      return previews
    } catch (error) {
      console.error('Error getting screenshots:', error)
      throw error
    }
  })
  ipcMain.handle('delete-screenshot', async (_, path: string) => {
    return deps.deleteScreenshot(path)
  })
  ipcMain.handle('trigger-screenshot', async () => {
    const mainWindow = deps.getMainWindow()
    if (mainWindow) {
      try {
        const screenshotPath = await deps.takeScreenshot()
        const preview = await deps.getImagePreview(screenshotPath)
        mainWindow.webContents.send('screenshot-taken', { path: screenshotPath, preview })
        return { success: true }
      } catch (error) {
        console.error('Error triggering screenshot:', error)
        return { success: false, error: 'Failed to take screenshot' }
      }
    }
    return { success: false, error: 'Main window not found' }
  })
  ipcMain.handle('toggle-main-window', async () => {
    return deps.toggleMainWindow()
  })

  // New: Discord-like overlay mode toggle
  ipcMain.handle('toggle-overlay-mode', async () => {
    return deps.toggleOverlayMode()
  })

  // New: Set content state for smart click-through
  ipcMain.handle('set-has-content', async (_, hasContent: boolean) => {
    return deps.setHasContent(hasContent)
  })

  // New: Dynamic mouse ignore control
  ipcMain.handle('set-mouse-ignore', async (_, ignore: boolean) => {
    return deps.setMouseIgnore(ignore)
  })
  ipcMain.handle('delete-last-screenshot', async () => {
    try {
      const queue =
        deps.getView() === 'queue' ? deps.getScreenshotQueue() : deps.getExtraScreenshotQueue()
      console.log('queue', queue)

      if (queue.length === 0) {
        return { success: false, error: 'No screenshots to delete' }
      }

      const lastScreenshot = queue[queue.length - 1]
      const result = await deps.deleteScreenshot(lastScreenshot)

      const mainWindow = deps.getMainWindow()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('screenshot-deleted')
      }

      return result
    } catch (error) {
      console.error('Error deleting last screenshot:', error)
      return { success: false, error: 'Failed to delete screenshot' }
    }
  })
  ipcMain.handle('open-settings-portal', async () => {
    const mainWindow = deps.getMainWindow()
    if (mainWindow) {
      mainWindow.webContents.send('show-settings-dialog')
      return { success: true }
    }
    return { success: false, error: 'Main window not found' }
  })
  ipcMain.handle('trigger-process-screenshots', async () => {
    try {
      if (!configManager.hasApiKey()) {
        const mainWindow = deps.getMainWindow()
        if (mainWindow) {
          mainWindow.webContents.send(deps.PROCESSING_EVENTS.API_KEY_INVALID)
        }
        return { success: false, error: 'No API key found' }
      }
      await deps.processingManager?.processScreenshots()
      return { success: true }
    } catch (error) {
      console.error('Error triggering process screenshots:', error)
      return { success: false, error: 'Failed to process screenshots' }
    }
  })
  ipcMain.handle('trigger-reset', async () => {
    try {
      deps.processingManager?.cancelOngoingRequest()

      deps.clearQueues()
      deps.setView('queue')

      const mainWindow = deps.getMainWindow()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('reset-view')
      }
      return { success: true }
    } catch (error) {
      console.error('Error triggering reset:', error)
      return { success: false, error: 'Failed to reset' }
    }
  })
  ipcMain.handle('set-window-dimensions', (_, width: number, height: number) => {
    return deps.setWindowDimensions(width, height)
  })
  ipcMain.handle(
    'update-content-dimensions',
    async (_, { width, height }: { width: number; height: number }) => {
      console.log('update-content-dimensions', width, height)
      if (width && height) {
        deps.setWindowDimensions(width, height)
      }
    }
  )
  ipcMain.handle('openLink', (_, url: string) => {
    try {
      console.log('openLink', url)
      shell.openExternal(url)
      return { success: true }
    } catch (error) {
      console.error('Error opening link:', error)
      return { success: false, error: 'Failed to open link' }
    }
  })

  // Session Management IPC Handlers
  ipcMain.handle('create-new-session', () => {
    try {
      const sessionId = sessionManager.createNewSession()
      return { success: true, sessionId }
    } catch (error) {
      console.error('Error creating new session:', error)
      return { success: false, error: 'Failed to create new session' }
    }
  })

  ipcMain.handle('get-current-session', () => {
    try {
      const sessionData = sessionManager.loadSessionData()
      return { success: true, data: sessionData }
    } catch (error) {
      console.error('Error getting current session:', error)
      return { success: false, error: 'Failed to get current session' }
    }
  })

  ipcMain.handle('update-session-notes', (_, notes: string) => {
    try {
      sessionManager.updateNotes(notes)
      return { success: true }
    } catch (error) {
      console.error('Error updating session notes:', error)
      return { success: false, error: 'Failed to update notes' }
    }
  })

  ipcMain.handle('upload-session-file', async () => {
    try {
      const mainWindow = deps.getMainWindow()
      if (!mainWindow) {
        throw new Error('No main window available')
      }

      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Upload File to Session',
        filters: [
          { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'md'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile', 'multiSelections']
      })

      if (result.canceled || !result.filePaths.length) {
        return { success: false, error: 'No files selected' }
      }

      const uploadedFiles = []
      for (const filePath of result.filePaths) {
        const sessionFilePath = await sessionManager.addUploadedFile(filePath)
        uploadedFiles.push({
          name: require('path').basename(filePath),
          path: sessionFilePath
        })
      }

      return { success: true, files: uploadedFiles }
    } catch (error) {
      console.error('Error uploading session file:', error)
      return { success: false, error: 'Failed to upload file' }
    }
  })

  ipcMain.handle('remove-session-file', (_, fileName: string) => {
    try {
      sessionManager.removeUploadedFile(fileName)
      return { success: true }
    } catch (error) {
      console.error('Error removing session file:', error)
      return { success: false, error: 'Failed to remove file' }
    }
  })

  ipcMain.handle('save-meeting-transcript', (_, transcript: string) => {
    try {
      sessionManager.saveMeetingTranscript(transcript)
      return { success: true }
    } catch (error) {
      console.error('Error saving meeting transcript:', error)
      return { success: false, error: 'Failed to save transcript' }
    }
  })

  ipcMain.handle('cleanup-session', () => {
    try {
      sessionManager.cleanupSession()
      return { success: true }
    } catch (error) {
      console.error('Error cleaning up session:', error)
      return { success: false, error: 'Failed to cleanup session' }
    }
  })

  ipcMain.handle('get-all-sessions', () => {
    try {
      const sessions = sessionManager.getAllSessions()
      return { success: true, sessions }
    } catch (error) {
      console.error('Error getting all sessions:', error)
      return { success: false, error: 'Failed to get sessions' }
    }
  })

  ipcMain.handle('get-session-directory', () => {
    try {
      const directory = sessionManager.getAppDataDir()
      return { success: true, directory }
    } catch (error) {
      console.error('Error getting session directory:', error)
      return { success: false, error: 'Failed to get directory' }
    }
  })

  // Component visibility handlers
  ipcMain.handle('get-component-visibility', () => {
    try {
      return { success: true, visibility: state.componentVisibility }
    } catch (error) {
      console.error('Error getting component visibility:', error)
      return { success: false, error: 'Failed to get component visibility' }
    }
  })
}