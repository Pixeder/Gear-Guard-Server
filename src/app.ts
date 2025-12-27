import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';


// Import the Prisma-aware Error Middleware
import { errorHandler } from './middlewares/error.middleware.js';

const app: Application = express();

// ============================================
// 1. Global Middlewares
// ============================================

// A. Security Headers
app.use(helmet());

// B. CORS (Allow Frontend to connect)
// app.use(cors({
//   origin: process.env.CORS_ORIGIN || '*', 
//   credentials: true, // Crucial for sending Cookies (JWT)
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

app.use(
  cors({
    origin: true, // 🟢 This creates a "Reflecting Origin" (Trusts everyone)
    credentials: true, // 🟢 Allows the Login Cookie to pass through
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// C. Rate Limiting (Basic DDoS protection)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use('/api', limiter); // Apply only to API routes

// D. Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// E. Body Parsers
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

// ============================================
// 2. Routes
// ============================================

app.get('/', (req, res) => {
  res.status(200).json({
    message: "Welcome to GearGuard API ⚙️🛡️",
    status: "active",
    documentation: "/api/docs", // Optional: If you add Swagger later
    timestamp: new Date().toISOString()
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'active', 
    service: 'GearGuard Backend',
    timestamp: new Date().toISOString() 
  });
});

import authRouter from './routes/auth.routes.js';
// Route
app.use('/api/v1/users', authRouter);

import coreRoutes from './routes/cores.routes.js';
// Route
app.use('/api/v1/core', coreRoutes);

// ============================================
// 3. Error Handling (Must be last)
// ============================================
app.use(errorHandler);

export { app };