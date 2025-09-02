import { app, shell, BrowserWindow, screen, Tray, Menu, nativeImage } from 'electron'
import path, { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import { initializeIpcHandler } from './lib/ipcHandlers'
import { KeyboardShortcutHelper } from './lib/keyboard-shortcuts'
import { ScreenshotManager } from './lib/screenshot-manager'
import { ProcessingManager } from './lib/processing-manager'
import { configManager } from './lib/config-manager'
import { sessionManager } from './lib/session-manager'

let tray: Tray | null = null

export const state = {
  mainWindow: null as BrowserWindow | null,
  isWindowVisible: false,
  isOverlayMode: true, // Default to overlay mode (full-screen transparent)
  isEditMode: false, // New: tracks if we're in edit mode (dragging components)
  hasContent: false, // New: tracks if there's actual content to display
  windowPosition: null as { x: number; y: number } | null,
  windowSize: null as { width: number; height: number } | null,
  minimalSize: { width: 40, height: 40 }, // Legacy: for compatibility
  screenWidth: 0,
  screenHeight: 0,
  step: 0,
  currentX: 0,
  currentY: 0,
  componentVisibility: {
    controlBar: true,
    suggestionArea: true,
    notesComponent: true
  },

  keyboardShortcutHelper: null as KeyboardShortcutHelper | null,
  screenshotManager: null as ScreenshotManager | null,
  processingManager: null as ProcessingManager | null,

  view: 'queue' as 'queue' | 'solutions' | 'debug',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  problemInfo: null as any,
  hasDebugged: false,

  PROCESSING_EVENTS: {
    NO_SCREENSHOTS: 'processing-no-screenshots',
    API_KEY_INVALID: 'api-key-invalid',
    INITIAL_START: 'initial-start',
    PROBLEM_EXTRACTED: 'problem-extracted',
    SOLUTION_SUCCESS: 'solution-success',
    INITIAL_SOLUTION_ERROR: 'solution-error',
    DEBUG_START: 'debug-start',
    DEBUG_SUCCESS: 'debug-success',
    DEBUG_ERROR: 'debug-error'
  }
}

async function createWindow(): Promise<void> {
  if (state.mainWindow) {
    if (state.mainWindow.isMinimized()) state.mainWindow.restore()
    state.mainWindow.focus()
    return
  }

  const primaryDisplay = screen.getPrimaryDisplay()
  const workArea = primaryDisplay.workAreaSize
  state.screenWidth = workArea.width
  state.screenHeight = workArea.height

  state.step = 60
  state.currentY = 50

  // Create the browser window - full screen overlay by default
  const windowSettings: Electron.BrowserWindowConstructorOptions = {
    width: workArea.width,
    height: workArea.height,
    x: primaryDisplay.workArea.x,
    y: primaryDisplay.workArea.y,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    fullscreenable: false,
    hasShadow: false,
    opacity: 1.0,
    backgroundColor: '#00000000',
    focusable: true,
    skipTaskbar: true,
    type: 'panel',
    paintWhenInitiallyHidden: true,
    titleBarStyle: 'hidden',
    enableLargerThanScreen: true,
    movable: false, // Disable moving for overlay
    show: false,
    autoHideMenuBar: true,
    resizable: false, // Disable resizing for overlay
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      scrollBounce: true
    }
  }

  state.mainWindow = new BrowserWindow(windowSettings)

  state.mainWindow.on('ready-to-show', () => {
    app.dock?.show() // Before showing window
    showMainWindow()
    app.dock?.hide() // Then hide dock again after showing
  })

  state.mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    state.mainWindow?.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    state.mainWindow?.loadFile(join(__dirname, '../renderer/index.html'))
  }

  state.mainWindow.webContents.setZoomFactor(1)
  //TODO: Comment this out when not in development
  // state.mainWindow.webContents.openDevTools()
  state.mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  state.mainWindow.setContentProtection(true)

  state.mainWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true
  })
  state.mainWindow.setAlwaysOnTop(true, 'screen-saver', 1)

  if (process.platform === 'darwin') {
    state.mainWindow.setHiddenInMissionControl(true)
    state.mainWindow.setWindowButtonVisibility(false)
    state.mainWindow.setBackgroundColor('#00000000')

    state.mainWindow.setSkipTaskbar(true)
    state.mainWindow.setHasShadow(false)
  }

  state.mainWindow.on('close', () => {
    state.mainWindow = null
    state.isWindowVisible = false
  })

  state.mainWindow.webContents.setBackgroundThrottling(false)
  state.mainWindow.webContents.setFrameRate(60)

  state.mainWindow.on('move', handleWindowMove)
  state.mainWindow.on('resize', handleWindowResize)
  state.mainWindow.on('closed', handleWindowClosed)

  const bounds = state.mainWindow.getBounds()
  state.windowPosition = { x: bounds.x, y: bounds.y }
  state.windowSize = { width: bounds.width, height: bounds.height }
  state.currentX = bounds.x
  state.currentY = bounds.y
  state.isWindowVisible = true

  const savedOpacity = configManager.getOpacity()
  console.log('savedOpacity', savedOpacity)

  state.mainWindow.showInactive()

  if (savedOpacity <= 0.1) {
    console.log('Initial opacity too low, setting to 0 and hiding window')
    state.mainWindow.setOpacity(0)
    state.isWindowVisible = false
  } else {
    console.log('Setting opacity to', savedOpacity)
    state.mainWindow.setOpacity(savedOpacity)
    state.isWindowVisible = true
  }

  // Initialize overlay mode - window is interactive, CSS handles click-through
  updateClickThroughBehavior()
}

function getMainWindow(): BrowserWindow | null {
  return state.mainWindow
}

async function takeScreenshot(): Promise<string> {
  if (!state.mainWindow) throw new Error('Main window not found')

  return (
    state.screenshotManager?.takeScreenshot(
      () => hideMainWindow(),
      () => showMainWindow()
    ) || ''
  )
}

async function getImagePreview(filePath: string): Promise<string> {
  return state.screenshotManager?.getImagePreview(filePath) || ''
}

function setView(view: 'queue' | 'solutions' | 'debug'): void {
  state.view = view
  state.screenshotManager?.setView(view)
}

function getView(): 'queue' | 'solutions' | 'debug' {
  return state.view
}

function clearQueues(): void {
  state.screenshotManager?.clearQueues()
  state.problemInfo = null
  setView('queue')
}

function getScreenshotQueue(): string[] {
  return state.screenshotManager?.getScreenshotQueue() || []
}

function getExtraScreenshotQueue(): string[] {
  return state.screenshotManager?.getExtraScreenshotQueue() || []
}

async function deleteScreenshot(path: string): Promise<{ success: boolean; error?: string }> {
  return (
    state.screenshotManager?.deleteScreenshot(path) || {
      success: false,
      error: 'Failed to delete screenshot'
    }
  )
}

function handleWindowMove(): void {
  if (!state.mainWindow) return

  const bounds = state.mainWindow.getBounds()
  state.windowPosition = { x: bounds.x, y: bounds.y }
  state.currentX = bounds.x
  state.currentY = bounds.y
}

function handleWindowResize(): void {
  if (!state.mainWindow) return

  const bounds = state.mainWindow.getBounds()
  state.windowSize = { width: bounds.width, height: bounds.height }
}

function handleWindowClosed(): void {
  state.mainWindow = null
  state.isWindowVisible = false
  state.windowPosition = null
  state.windowSize = null
}

function moveWindowHorizontal(updateFn: (x: number) => number): void {
  if (!state.mainWindow) return
  state.currentX = updateFn(state.currentX)
  state.mainWindow.setPosition(Math.round(state.currentX), Math.round(state.currentY))
}

function moveWindowVertical(updateFn: (y: number) => number): void {
  if (!state.mainWindow) return

  const newY = updateFn(state.currentY)

  const maxUpLimit = (-(state.windowSize?.height || 0) * 2) / 3
  const maxDownLimit = state.screenHeight + ((state.windowSize?.height || 0) * 2) / 3

  console.log({
    newY,
    maxUpLimit,
    maxDownLimit,
    screenHeight: state.screenHeight,
    windowHeight: state.windowSize?.height,
    currentY: state.currentY
  })

  if (newY >= maxUpLimit && newY <= maxDownLimit) {
    state.currentY = newY
    state.mainWindow.setPosition(Math.round(state.currentX), Math.round(state.currentY))
  }
}

function hideMainWindow(): void {
  console.log('🧩 hideMainWindow triggered')

  if (!state.mainWindow || state.mainWindow.isDestroyed()) {
    console.warn('⚠️ Cannot hide window: not initialized or destroyed.')
    return
  }

  const bounds = state.mainWindow.getBounds()
  state.windowPosition = { x: bounds.x, y: bounds.y }
  state.windowSize = { width: bounds.width, height: bounds.height }

  state.mainWindow.setIgnoreMouseEvents(true, { forward: true })
  state.mainWindow.setOpacity(0)
  state.mainWindow.hide() // <-- Add this to fully hide window

  state.isWindowVisible = false
  console.log('✅ Window hidden: opacity 0 and mouse ignored')
}

function showMainWindow(): void {
  console.log('🧩 showMainWindow triggered')

  if (!state.mainWindow || state.mainWindow.isDestroyed()) {
    console.warn('⚠️ Cannot show window: not initialized or destroyed.')
    return
  }

  if (state.windowPosition && state.windowSize) {
    state.mainWindow.setBounds({
      ...state.windowPosition,
      ...state.windowSize
    })
  }

  state.mainWindow.setAlwaysOnTop(true, 'screen-saver', 1)
  state.mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  state.mainWindow.setContentProtection(true)

  // Avoid flicker
  state.mainWindow.setOpacity(0)
  state.mainWindow.showInactive()

  setTimeout(() => {
    if (!state.mainWindow?.isDestroyed()) {
      state.mainWindow?.setOpacity(1)
    }
  }, 100)

  state.isWindowVisible = true
  console.log('✅ Window shown and interactive again')
}

// === Component Visibility Logic ===
function toggleComponent(componentName: 'controlBar' | 'suggestionArea' | 'notesComponent') {
  // Toggle the component visibility
  state.componentVisibility[componentName] = !state.componentVisibility[componentName]
  
  // Send the updated visibility state to the renderer
  state.mainWindow?.webContents.send('component-visibility-changed', {
    component: componentName,
    visible: state.componentVisibility[componentName]
  })
  
  // Update the tray menu to reflect the new state
  updateTrayMenu()
  
  console.log(`${componentName} visibility toggled to:`, state.componentVisibility[componentName])
}

function updateTrayMenu() {
  if (!tray) return
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Control Bar',
      type: 'checkbox',
      checked: state.componentVisibility.controlBar,
      click: () => toggleComponent('controlBar')
    },
    {
      label: 'Suggestion Area',
      type: 'checkbox', 
      checked: state.componentVisibility.suggestionArea,
      click: () => toggleComponent('suggestionArea')
    },
    {
      label: 'Notes Component',
      type: 'checkbox',
      checked: state.componentVisibility.notesComponent,
      click: () => toggleComponent('notesComponent')
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        // 1. Make sure the window is visible before showing a dialog in it.
        if (!state.isWindowVisible) {
          showMainWindow()
        }
        // 2. Ensure window is interactive for settings dialog
        state.mainWindow?.setIgnoreMouseEvents(false)
        // 3. Send a message to the renderer process to open the settings.
        state.mainWindow?.webContents.send('show-settings-dialog')
      }
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])
  
  tray.setContextMenu(contextMenu)
}

// === Tray Logic ===
function createTray() {
  // Use the existing icon.png and resize it for tray
  const trayIcon = nativeImage.createFromPath(icon)
  
  // Resize the icon to appropriate tray size
  const resizedIcon = trayIcon.resize({ width: 24, height: 24 })

  tray = new Tray(resizedIcon)
  tray.setToolTip('Cogni - AI Assistant')

  // Initialize the tray menu
  updateTrayMenu()

  if (process.platform === 'darwin') {
    app.dock?.hide()
  }
}

function toggleMainWindow(): void {
  console.log('🔁 toggleMainWindow called. Current visible:', state.isWindowVisible)

  if (state.isWindowVisible) {
    hideMainWindow()
  } else {
    showMainWindow()
  }

  console.log('🟢 New visibility state:', state.isWindowVisible)
}

function toggleOverlayMode(): void {
  // This function now toggles edit mode instead of overlay mode
  toggleEditMode()
}

function toggleEditMode(): void {
  console.log('🔄 toggleEditMode called. Current edit mode:', state.isEditMode)

  if (!state.mainWindow || state.mainWindow.isDestroyed()) {
    console.warn('⚠️ Cannot toggle edit mode: window not initialized')
    return
  }

  state.isEditMode = !state.isEditMode

  if (state.isEditMode) {
    // Enter edit mode - make window interactive
    enterEditMode()
  } else {
    // Exit edit mode - return to click-through overlay
    exitEditMode()
  }

  // Notify renderer about mode change
  state.mainWindow.webContents.send('edit-mode-changed', state.isEditMode)

  console.log('🟢 New edit mode:', state.isEditMode)
}

function enterEditMode(): void {
  if (!state.mainWindow || state.mainWindow.isDestroyed()) return

  // Make window fully interactive for editing
  state.mainWindow.setIgnoreMouseEvents(false)
  state.mainWindow.focus()

  console.log('✅ Entered edit mode - components can be dragged')
}

function exitEditMode(): void {
  if (!state.mainWindow || state.mainWindow.isDestroyed()) return

  // Only exit if currently in edit mode
  if (!state.isEditMode) return

  state.isEditMode = false

  // Re-enable true click-through for overlay mode
  state.mainWindow.setIgnoreMouseEvents(true, { forward: true })

  // Notify renderer about mode change
  state.mainWindow.webContents.send('edit-mode-changed', false)

  console.log('✅ Exited edit mode - returned to click-through overlay')
}

function updateClickThroughBehavior(): void {
  if (!state.mainWindow || state.mainWindow.isDestroyed()) return

  if (state.isEditMode) {
    // Edit mode: window fully interactive
    state.mainWindow.setIgnoreMouseEvents(false)
    console.log('🖱️ Edit mode - window fully interactive')
  } else {
    // Overlay mode: true click-through with component regions
    state.mainWindow.setIgnoreMouseEvents(true, { forward: true })
    console.log('🖱️ Overlay mode - true click-through enabled')
  }
}

function setMouseIgnore(ignore: boolean): void {
  if (!state.mainWindow || state.mainWindow.isDestroyed()) return

  if (state.isEditMode) {
    // Always interactive in edit mode
    state.mainWindow.setIgnoreMouseEvents(false)
    return
  }

  if (ignore) {
    state.mainWindow.setIgnoreMouseEvents(true, { forward: true })
  } else {
    state.mainWindow.setIgnoreMouseEvents(false)
  }
}

function setHasContent(hasContent: boolean): void {
  const previousHasContent = state.hasContent
  state.hasContent = hasContent

  if (previousHasContent !== hasContent) {
    updateClickThroughBehavior()
    console.log('📄 Content state changed:', hasContent)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getProblemInfo(): any {
  return state.problemInfo
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setProblemInfo(problemInfo: any): void {
  state.problemInfo = problemInfo
}

function getHasDebugged(): boolean {
  return state.hasDebugged
}

function setHasDebugged(hasDebugged: boolean): void {
  state.hasDebugged = hasDebugged
}

function getScreenshotManager(): ScreenshotManager | null {
  return state.screenshotManager
}

function initializeHelpers() {
  state.screenshotManager = new ScreenshotManager(state.view)
  state.processingManager = new ProcessingManager({
    getView,
    setView,
    getProblemInfo,
    setProblemInfo,
    getScreenshotQueue,
    getExtraScreenshotQueue,
    clearQueues,
    takeScreenshot,
    getImagePreview,
    deleteScreenshot,
    setHasDebugged,
    getHasDebugged,
    getMainWindow,
    getScreenshotManager,
    PROCESSING_EVENTS: state.PROCESSING_EVENTS
  })
  state.keyboardShortcutHelper = new KeyboardShortcutHelper({
    moveWindowLeft: () =>
      moveWindowHorizontal((x) => Math.max(-(state.windowSize?.width || 0) / 2, x - state.step)),
    moveWindowRight: () =>
      moveWindowHorizontal((x) =>
        Math.min(state.screenWidth - (state.windowSize?.width || 0) / 2, x + state.step)
      ),
    moveWindowUp: () => moveWindowVertical((y) => y - state.step),
    moveWindowDown: () => moveWindowVertical((y) => y + state.step),
    toggleMainWindow: toggleMainWindow,
    toggleOverlayMode: toggleOverlayMode, // New: Discord-like overlay toggle (edit mode)
    exitEditMode: exitEditMode, // New: Exit edit mode with ESC
    isVisible: () => state.isWindowVisible,
    getMainWindow: getMainWindow,
    takeScreenshot: takeScreenshot,
    getImagePreview: getImagePreview,
    clearQueues: clearQueues,
    setView: setView,
    processingManager: state.processingManager
  })
}

function setWindowDimensions(width: number, height: number): void {
  if (!state.mainWindow?.isDestroyed()) {
    // Don't resize if in overlay mode
    if (state.isOverlayMode) {
      return
    }

    const [currentX, currentY] = state.mainWindow?.getPosition() || [0, 0]
    const primaryDisplay = screen.getPrimaryDisplay()
    const workArea = primaryDisplay.workAreaSize
    const maxWidth = Math.floor(workArea.width * 0.5)

    // Ensure minimum dimensions
    const finalWidth = Math.max(300, Math.min(width + 32, maxWidth))
    const finalHeight = Math.max(200, Math.ceil(height))

    state.mainWindow?.setBounds({
      x: Math.min(currentX, workArea.width - finalWidth),
      y: currentY,
      width: finalWidth,
      height: finalHeight
    })

    // Update content state based on actual content size
    const hasActualContent = width > 100 && height > 100
    setHasContent(hasActualContent)
  }
}

async function initializeApp() {
  try {
    const appDataPath = path.join(app.getPath('appData'), 'silent-coder')
    const sessionPath = path.join(appDataPath, 'session')
    const tempPath = path.join(appDataPath, 'temp')
    const cachePath = path.join(appDataPath, 'cache')
    console.log('App data path:', appDataPath)

    for (const dir of [appDataPath, sessionPath, tempPath, cachePath]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    }

    app.setPath('userData', appDataPath)
    app.setPath('sessionData', sessionPath)
    app.setPath('temp', tempPath)
    app.setPath('cache', cachePath)

    initializeHelpers()
    initializeIpcHandler({
      getView,
      getMainWindow,
      takeScreenshot,
      clearQueues,
      setView,
      moveWindowLeft: () =>
        moveWindowHorizontal((x) => Math.max(-(state.windowSize?.width || 0) / 2, x - state.step)),
      moveWindowRight: () =>
        moveWindowHorizontal((x) =>
          Math.min(state.screenWidth - (state.windowSize?.width || 0) / 2, x + state.step)
        ),
      moveWindowUp: () => moveWindowVertical((y) => y - state.step),
      moveWindowDown: () => moveWindowVertical((y) => y + state.step),
      toggleMainWindow: toggleMainWindow,
      toggleOverlayMode: toggleOverlayMode, // New: expose overlay toggle to IPC
      isVisible: () => state.isWindowVisible,
      getScreenshotQueue: getScreenshotQueue,
      getExtraScreenshotQueue: getExtraScreenshotQueue,
      deleteScreenshot: deleteScreenshot,
      getImagePreview: getImagePreview,
      PROCESSING_EVENTS: state.PROCESSING_EVENTS,
      processingManager: state.processingManager,
      setWindowDimensions: setWindowDimensions,
      setHasContent: setHasContent, // New: expose content state to IPC
      setMouseIgnore: setMouseIgnore // New: dynamic click-through control
    })

    await createWindow()
    createTray()

    state.keyboardShortcutHelper?.registerGlobalShortcuts()
  } catch (error) {
    console.error('Failed to initialize app:', error)
    app.quit()
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(initializeApp)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Clean up session data before quitting (preserve transcript)
app.on('before-quit', () => {
  console.log('App is quitting, cleaning up session data...')
  try {
    sessionManager.cleanupSession()
  } catch (error) {
    console.error('Error cleaning up session on quit:', error)
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.