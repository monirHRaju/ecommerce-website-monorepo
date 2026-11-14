import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import './config/passport'; // initialize passport strategies
import router from './routers';
import AppError from './utils/AppError';

const app: Application = express();

// Disable X-Powered-By header for smaller/cleaner responses
app.disable('x-powered-by');

// Parsers
app.use(express.json({ limit: '1mb' }));

// CORS — allow all configured origins (including www / non-www variants and in-app webviews)
const rawOrigins = [
  process.env.PUBLIC_URL,
  process.env.PUBLIC_ADMIN_URL,
  process.env.CORS_ORIGIN,
  'http://localhost:3000',
  'http://localhost:3001',
]
  .flatMap((entry) => (entry ? entry.split(',') : []))
  .map((entry) => entry.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = new Set<string>(rawOrigins);
for (const orig of rawOrigins) {
  try {
    const url = new URL(orig);
    if (url.hostname.startsWith('www.')) {
      allowedOrigins.add(`${url.protocol}//${url.hostname.slice(4)}${url.port ? `:${url.port}` : ''}`);
    } else if (url.hostname !== 'localhost' && !/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)) {
      allowedOrigins.add(`${url.protocol}//www.${url.hostname}${url.port ? `:${url.port}` : ''}`);
    }
  } catch {
    // ignore invalid URL
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server (no origin), whitelisted origins, and mobile in-app webviews (Facebook/Instagram)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.trim().replace(/\/+$/, '');
      if (allowedOrigins.has(cleanOrigin)) return callback(null, true);
      // Fallback: reflect origin so visitors from www/non-www, preview URLs, or Facebook WebView are never blocked
      return callback(null, true);
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Public catalog cache headers for fast edge/SSR caching
app.use('/api/v1', (req: Request, res: Response, next: NextFunction) => {
  if (
    req.method === 'GET' &&
    (req.path.startsWith('/products') ||
      req.path.startsWith('/categories') ||
      req.path.startsWith('/delivery-zones'))
  ) {
    res.vary('Origin');
    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300');
  }
  next();
});

// Application routes
app.use('/api/v1', router);

// Root health check
app.get('/', (_req: Request, res: Response) => {
  res.send('Fashion e-commerce API server is running!');
});

// 404 handler
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError('Route not found', 404));
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Something went wrong';
  // Always log non-operational errors so they're visible in the server terminal
  if (!err.isOperational) console.error('[Error]', err);
  res.status(statusCode).json({
    success: false,
    message,
    // Expose real message in dev for easier debugging
    ...(process.env.NODE_ENV !== 'production' && { debug: err.message, stack: err.stack }),
  });
});

export default app;
