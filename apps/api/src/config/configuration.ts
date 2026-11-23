export interface AppConfig {
  port: number;
  salesInboxEmail: string;
  corsOrigin: string;
  emailLogPath: string;
}

/**
 * Registered with ConfigModule.forRoot({ load: [configuration] }), so
 * every value here is reachable as `configService.get<T>('app.<key>')`
 * anywhere in the app - replaces the old hand-rolled loadConfig()
 * that every consumer called directly (bypassing DI entirely).
 */
export default (): { app: AppConfig } => ({
  app: {
    port: Number(process.env.PORT ?? 3000),
    salesInboxEmail: process.env.SALES_INBOX_EMAIL ?? 'sales@example.com',
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    emailLogPath: process.env.EMAIL_LOG_PATH ?? './tmp/sent-emails.log',
  },
});
