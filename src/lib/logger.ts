/**
 * Centralized logging utility with environment-based filtering
 * Provides consistent logging across the application with proper levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogContext {
  component?: string
  action?: string
  userId?: string
  marinaId?: string
}

class Logger {
  private logLevel: LogLevel

  constructor() {
    // Set log level based on environment
    this.logLevel = process.env.NODE_ENV === 'production' 
      ? LogLevel.ERROR 
      : LogLevel.DEBUG
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` [${Object.entries(context).map(([k, v]) => `${k}:${v}`).join('|')}]` : ''
    return `[${timestamp}] [${level}]${contextStr} ${message}`
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message), ...args)
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage('INFO', message), ...args)
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message), ...args)
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message), ...args)
    }
  }

  // Convenience methods for common logging patterns
  auth(message: string, context?: LogContext): void {
    this.info(`🔐 ${message}`, context)
  }

  db(message: string, context?: LogContext): void {
    this.info(`🗄️ ${message}`, context)
  }

  api(message: string, context?: LogContext): void {
    this.info(`🌐 ${message}`, context)
  }

  component(message: string, context?: LogContext): void {
    this.debug(`🧩 ${message}`, context)
  }
}

// Export singleton instance
export const logger = new Logger()

// Export individual methods for convenience
export const { debug, info, warn, error, auth, db, api, component } = logger



