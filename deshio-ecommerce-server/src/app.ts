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

// CORS — allow all configured origins
const allowedOrigins = [
  process.env.PUBLIC_URL,
  process.env.PUBLIC_ADMIN_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server (no origin) and whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
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
