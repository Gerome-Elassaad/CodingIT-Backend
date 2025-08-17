"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const stripe_1 = require("./routes/stripe");
const auth_1 = require("./routes/auth");
const chat_1 = require("./routes/chat");
const code_1 = require("./routes/code");
const files_1 = require("./routes/files");
const sandbox_1 = require("./routes/sandbox");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// CORS configuration
const corsOptions = {
    origin: [
        'https://codinit.dev',
        'https://www.codinit.dev',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
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
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Not Found' });
});
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
exports.default = app;
//# sourceMappingURL=server.js.map