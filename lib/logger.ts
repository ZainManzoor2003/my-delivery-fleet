export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
    level: LogLevel
    message: string
    timestamp: string
    metadata?: Record<string, any>
    orderId?: string
    deliveryId?: string
}

class Logger {
    private isProduction = process.env.NODE_ENV === 'production'

    private formatLog(entry: LogEntry): string {
        const { level, message, timestamp, metadata, orderId, deliveryId } = entry

        let logString = `[${timestamp}] ${level.toUpperCase()}`

        if (orderId) logString += ` [ORDER:${orderId}]`
        if (deliveryId) logString += ` [DELIVERY:${deliveryId}]`

        logString += `: ${message}`

        if (metadata && Object.keys(metadata).length > 0) {
            logString += ` | ${JSON.stringify(metadata)}`
        }

        return logString
    }

    private createLogEntry(level: LogLevel, message: string, metadata?: Record<string, any>, orderId?: string, deliveryId?: string): LogEntry {
        return {
            level,
            message,
            timestamp: new Date().toISOString(),
            metadata,
            orderId,
            deliveryId
        }
    }

    info(message: string, metadata?: Record<string, any>, orderId?: string, deliveryId?: string) {
        const entry = this.createLogEntry('info', message, metadata, orderId, deliveryId)
        const formatted = this.formatLog(entry)

        console.log(formatted)
    }

    warn(message: string, metadata?: Record<string, any>, orderId?: string, deliveryId?: string) {
        const entry = this.createLogEntry('warn', message, metadata, orderId, deliveryId)
        const formatted = this.formatLog(entry)

        console.warn(formatted)
    }

    error(message: string, metadata?: Record<string, any>, orderId?: string, deliveryId?: string) {
        const entry = this.createLogEntry('error', message, metadata, orderId, deliveryId)
        const formatted = this.formatLog(entry)

        console.error(formatted)
    }

    debug(message: string, metadata?: Record<string, any>, orderId?: string, deliveryId?: string) {
        if (!this.isProduction) {
            const entry = this.createLogEntry('debug', message, metadata, orderId, deliveryId)
            const formatted = this.formatLog(entry)
            console.debug(formatted)
        }
    }

    // Special method for API requests
    apiRequest(method: string, endpoint: string, metadata?: Record<string, any>, orderId?: string) {
        this.info(`${method} ${endpoint}`, metadata, orderId)
    }

    // Special method for external API calls (like Uber)
    externalApi(service: string, action: string, metadata?: Record<string, any>, orderId?: string, deliveryId?: string) {
        this.info(`External API: ${service} - ${action}`, metadata, orderId, deliveryId)
    }

    // Special method for webhooks
    webhook(event: string, source: string, metadata?: Record<string, any>, orderId?: string, deliveryId?: string) {
        this.info(`Webhook: ${source} - ${event}`, metadata, orderId, deliveryId)
    }
}

export const logger = new Logger()
