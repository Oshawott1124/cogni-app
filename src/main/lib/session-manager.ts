import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export interface SessionData {
  sessionId: string
  timestamp: string
  notes: string
  uploadedFiles: Array<{
    name: string
    path: string
    originalPath: string
  }>
  meetingTranscript?: string
}

export class SessionManager {
  private appDataDir: string
  private currentSessionId: string | null = null
  private currentSessionDir: string | null = null

  constructor() {
    // Create app data directory in user's documents or app data folder
    const userDataPath = app.getPath('userData')
    this.appDataDir = path.join(userDataPath, 'cogni-sessions')
    this.ensureAppDataDir()
  }

  private ensureAppDataDir(): void {
    try {
      if (!fs.existsSync(this.appDataDir)) {
        fs.mkdirSync(this.appDataDir, { recursive: true })
        console.log(`Created app data directory: ${this.appDataDir}`)
      }
    } catch (error) {
      console.error('Error creating app data directory:', error)
      throw error
    }
  }

  /**
   * Create a new session with timestamp-based folder
   */
  createNewSession(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    this.currentSessionId = `session-${timestamp}`
    this.currentSessionDir = path.join(this.appDataDir, this.currentSessionId)

    try {
      // Create session directory
      fs.mkdirSync(this.currentSessionDir, { recursive: true })
      
      // Create subdirectories
      fs.mkdirSync(path.join(this.currentSessionDir, 'files'), { recursive: true })
      fs.mkdirSync(path.join(this.currentSessionDir, 'transcripts'), { recursive: true })
      
      // Initialize session data
      const sessionData: SessionData = {
        sessionId: this.currentSessionId,
        timestamp: new Date().toISOString(),
        notes: '',
        uploadedFiles: []
      }
      
      this.saveSessionData(sessionData)
      console.log(`Created new session: ${this.currentSessionId}`)
      
      return this.currentSessionId
    } catch (error) {
      console.error('Error creating new session:', error)
      throw error
    }
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId
  }

  /**
   * Get current session directory
   */
  getCurrentSessionDir(): string | null {
    return this.currentSessionDir
  }

  /**
   * Save session data to file
   */
  saveSessionData(data: SessionData): void {
    if (!this.currentSessionDir) {
      throw new Error('No active session')
    }

    try {
      const sessionFile = path.join(this.currentSessionDir, 'session.json')
      fs.writeFileSync(sessionFile, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Error saving session data:', error)
      throw error
    }
  }

  /**
   * Load session data from file
   */
  loadSessionData(): SessionData | null {
    if (!this.currentSessionDir) {
      return null
    }

    try {
      const sessionFile = path.join(this.currentSessionDir, 'session.json')
      if (fs.existsSync(sessionFile)) {
        const data = fs.readFileSync(sessionFile, 'utf-8')
        return JSON.parse(data) as SessionData
      }
    } catch (error) {
      console.error('Error loading session data:', error)
    }
    
    return null
  }

  /**
   * Add uploaded file to session
   */
  async addUploadedFile(filePath: string): Promise<string> {
    if (!this.currentSessionDir) {
      throw new Error('No active session')
    }

    try {
      const fileName = path.basename(filePath)
      const sessionFilesDir = path.join(this.currentSessionDir, 'files')
      const destinationPath = path.join(sessionFilesDir, fileName)

      // Copy file to session directory
      fs.copyFileSync(filePath, destinationPath)

      // Update session data
      const sessionData = this.loadSessionData()
      if (sessionData) {
        sessionData.uploadedFiles.push({
          name: fileName,
          path: destinationPath,
          originalPath: filePath
        })
        this.saveSessionData(sessionData)
      }

      return destinationPath
    } catch (error) {
      console.error('Error adding uploaded file:', error)
      throw error
    }
  }

  /**
   * Remove uploaded file from session
   */
  removeUploadedFile(fileName: string): void {
    if (!this.currentSessionDir) {
      throw new Error('No active session')
    }

    try {
      const sessionData = this.loadSessionData()
      if (sessionData) {
        const fileIndex = sessionData.uploadedFiles.findIndex(f => f.name === fileName)
        if (fileIndex !== -1) {
          const file = sessionData.uploadedFiles[fileIndex]
          
          // Delete physical file
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path)
          }
          
          // Remove from session data
          sessionData.uploadedFiles.splice(fileIndex, 1)
          this.saveSessionData(sessionData)
        }
      }
    } catch (error) {
      console.error('Error removing uploaded file:', error)
      throw error
    }
  }

  /**
   * Update session notes
   */
  updateNotes(notes: string): void {
    const sessionData = this.loadSessionData()
    if (sessionData) {
      sessionData.notes = notes
      this.saveSessionData(sessionData)
    }
  }

  /**
   * Save meeting transcript
   */
  saveMeetingTranscript(transcript: string): void {
    if (!this.currentSessionDir) {
      throw new Error('No active session')
    }

    try {
      const transcriptFile = path.join(this.currentSessionDir, 'transcripts', 'meeting-transcript.txt')
      fs.writeFileSync(transcriptFile, transcript)
      
      // Also update session data
      const sessionData = this.loadSessionData()
      if (sessionData) {
        sessionData.meetingTranscript = transcript
        this.saveSessionData(sessionData)
      }
    } catch (error) {
      console.error('Error saving meeting transcript:', error)
      throw error
    }
  }

  /**
   * Clean up session data (preserve transcript)
   */
  cleanupSession(): void {
    if (!this.currentSessionDir) {
      return
    }

    try {
      const sessionData = this.loadSessionData()
      if (sessionData) {
        // Preserve transcript but clear other data
        const cleanedData: SessionData = {
          sessionId: sessionData.sessionId,
          timestamp: sessionData.timestamp,
          notes: '', // Clear notes
          uploadedFiles: [], // Clear uploaded files
          meetingTranscript: sessionData.meetingTranscript // Keep transcript
        }

        // Delete uploaded files
        const filesDir = path.join(this.currentSessionDir, 'files')
        if (fs.existsSync(filesDir)) {
          const files = fs.readdirSync(filesDir)
          files.forEach(file => {
            fs.unlinkSync(path.join(filesDir, file))
          })
        }

        // Save cleaned session data
        this.saveSessionData(cleanedData)
        console.log(`Cleaned up session: ${this.currentSessionId}`)
      }
    } catch (error) {
      console.error('Error cleaning up session:', error)
    }
  }

  /**
   * Get all session directories
   */
  getAllSessions(): string[] {
    try {
      if (!fs.existsSync(this.appDataDir)) {
        return []
      }
      
      return fs.readdirSync(this.appDataDir)
        .filter(item => {
          const itemPath = path.join(this.appDataDir, item)
          return fs.statSync(itemPath).isDirectory() && item.startsWith('session-')
        })
        .sort()
        .reverse() // Most recent first
    } catch (error) {
      console.error('Error getting all sessions:', error)
      return []
    }
  }

  /**
   * Get app data directory path
   */
  getAppDataDir(): string {
    return this.appDataDir
  }
}

// Export singleton instance
export const sessionManager = new SessionManager()
