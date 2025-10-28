/**
 * Centralized logging utility for debugging and monitoring
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep last 100 logs
  private isDevelopment = import.meta.env.DEV;

  log(level: LogLevel, category: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    };

    // Add to in-memory logs
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output (color-coded)
    const prefix = `[${category}]`;
    const timestamp = new Date().toLocaleTimeString();

    if (this.isDevelopment) {
      switch (level) {
        case 'debug':
          console.log(`%c${timestamp} ${prefix}`, 'color: #888', message, data || '');
          break;
        case 'info':
          console.info(`%c${timestamp} ${prefix}`, 'color: #00f', message, data || '');
          break;
        case 'warn':
          console.warn(`%c${timestamp} ${prefix}`, 'color: #ff8800', message, data || '');
          break;
        case 'error':
          console.error(`%c${timestamp} ${prefix}`, 'color: #f00', message, data || '');
          if (data instanceof Error) {
            console.error(data.stack);
          }
          break;
      }
    } else {
      // In production, only log errors
      if (level === 'error') {
        console.error(`${timestamp} ${prefix}`, message, data);
      }
    }
  }

  debug(category: string, message: string, data?: any) {
    this.log('debug', category, message, data);
  }

  info(category: string, message: string, data?: any) {
    this.log('info', category, message, data);
  }

  warn(category: string, message: string, data?: any) {
    this.log('warn', category, message, data);
  }

  error(category: string, message: string, error?: any) {
    this.log('error', category, message, error);
  }

  // Get recent logs (for debugging UI)
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Export logs as JSON (for bug reports)
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear logs
  clear() {
    this.logs = [];
  }
}

// Singleton instance
export const logger = new Logger();

// Convenience exports
export const logDebug = (category: string, message: string, data?: any) =>
  logger.debug(category, message, data);

export const logInfo = (category: string, message: string, data?: any) =>
  logger.info(category, message, data);

export const logWarn = (category: string, message: string, data?: any) =>
  logger.warn(category, message, data);

export const logError = (category: string, message: string, error?: any) =>
  logger.error(category, message, error);
