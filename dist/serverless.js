"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const stripe_1 = require("./routes/stripe");
const auth_1 = require("./routes/auth");
const chat_1 = require("./routes/chat");
const code_1 = require("./routes/code");
const files_1 = require("./routes/files");
const sandbox_1 = require("./routes/sandbox");
// Create Express app
const app = (0, express_1.default)();
exports.handler = app;
// CORS configuration
const corsOptions = {
    origin: [
        'https://codinit.dev',
        'https://www.codinit.dev',
        'https://codingit.vercel.app',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Forwarded-For']
};
// Middleware
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Request logging middleware for serverless
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        serverless: true
    });
});
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'CodingIT Backend API - Serverless',
        version: '1.0.0',
        status: 'running'
    });
});
// API routes
app.use('/api/stripe', stripe_1.stripeRouter);
app.use('/api/auth', auth_1.authRouter);
app.use('/api/chat', chat_1.chatRouter);
app.use('/api/code', code_1.codeRouter);
app.use('/api/files', files_1.filesRouter);
app.use('/api/sandbox', sandbox_1.sandboxRouter);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Serverless API Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    res.status(500).json({
        error: 'Internal Server Error',
        timestamp: new Date().toISOString()
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});
// Export the Express app for serverless deployment
exports.default = app;
//# sourceMappingURL=serverless.js.map