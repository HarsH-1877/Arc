"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const passport_config_1 = __importDefault(require("./config/passport-config"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const oauth_routes_1 = __importDefault(require("./routes/oauth.routes"));
const setup_routes_1 = __importDefault(require("./routes/setup.routes"));
const handles_routes_1 = __importDefault(require("./routes/handles.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const friends_routes_1 = __importDefault(require("./routes/friends.routes"));
const compare_routes_1 = __importDefault(require("./routes/compare.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Initialize Passport
app.use(passport_config_1.default.initialize());
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Arc API is running' });
});
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/auth', oauth_routes_1.default); // OAuth routes (Google)
app.use('/api/auth', setup_routes_1.default); // Account setup routes
app.use('/api/handles', handles_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/friends', friends_routes_1.default);
app.use('/api/compare', compare_routes_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Arc API server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
exports.default = app;
