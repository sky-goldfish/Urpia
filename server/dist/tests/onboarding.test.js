import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
describe('onboarding api', () => {
    it('creates a session', async () => {
        const app = createApp();
        const response = await request(app).post('/api/onboarding/session').send({});
        expect(response.status).toBe(200);
        expect(response.body.sessionId).toBeTruthy();
        expect(response.body.reply).toContain('社交');
    });
    it('advances a chat session and returns a persona draft', async () => {
        const app = createApp();
        const session = await request(app).post('/api/onboarding/session').send({});
        const response = await request(app).post('/api/onboarding/chat').send({
            sessionId: session.body.sessionId,
            message: '我更喜欢安静的咖啡馆和展览',
            inputMode: 'text'
        });
        expect(response.status).toBe(200);
        expect(response.body.personaDraft.interestTags.length).toBeGreaterThan(0);
        expect(typeof response.body.done).toBe('boolean');
    });
});
