import cors from 'cors';
import express from 'express';
import { discoveryRouter } from './routes/discovery.js';
import { ApiError } from './lib/errors.js';
import { matchesRouter } from './routes/matches.js';
import { onboardingRouter } from './routes/onboarding.js';
import { meRouter } from './routes/me.js';
import { poisRouter } from './routes/pois.js';
export const createApp = () => {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok' });
    });
    app.use('/api/onboarding', onboardingRouter);
    app.use('/api/personas', onboardingRouter);
    app.use('/api/pois', poisRouter);
    app.use('/api/discovery', discoveryRouter);
    app.use('/api/matches', matchesRouter);
    app.use('/api/me', meRouter);
    app.use((error, _req, res, _next) => {
        if (error instanceof ApiError) {
            return res.status(error.status).json({ error: { code: error.code, message: error.message } });
        }
        console.error(error);
        return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '服务暂时不可用' } });
    });
    return app;
};
