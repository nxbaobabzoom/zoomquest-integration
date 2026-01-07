const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  log: (...args) => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  error: (...args) => {
    // Always log errors, but could send to error tracking service in production
    console.error(...args);
    // TODO: In production, send to error tracking service (e.g., Sentry)
  },
  warn: (...args) => {
    if (!isProduction) {
      console.warn(...args);
    }
  },
  info: (...args) => {
    if (!isProduction) {
      console.info(...args);
    }
  }
};

