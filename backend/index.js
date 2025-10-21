import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initializeServer } from './src/config/cognito.js';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT;

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    allowedHeaders: ["Content-Type", "Authorization", "X-Custom-Header"],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

// Routes Import
import healthRoute from './src/routes/health.route.js';
import authRoute from './src/routes/auth.route.js';
import telegramRoute from './src/routes/telegram.route.js';
import dashboardRoute from './src/routes/dashboard.route.js';

// Routes in Use
app.use('/health', healthRoute);
app.use('/auth', authRoute);
app.use('/telegram', telegramRoute);
app.use('/dashboard', dashboardRoute);

initializeServer().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((err) => {
    console.error('Error initializing server:', err);
});