import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
describe('me api', () => {
    it('returns current user and history', async () => {
        const app = createApp();
        const session = await request(app).post('/api/onboarding/session').send({});
        const userResponse = await request(app).post('/api/personas/confirm').send({
            sessionId: session.body.sessionId,
            nickname: '旅伴',
            avatarUrl: '/avatars/test.jpg'
        });
        const me = await request(app).get(`/api/me?userId=${userResponse.body.user.id}`);
        const history = await request(app).get(`/api/me/history?userId=${userResponse.body.user.id}`);
        expect(me.status).toBe(200);
        expect(history.status).toBe(200);
        expect(me.body.user.nickname).toBe('旅伴');
        expect(Array.isArray(history.body.items)).toBe(true);
    });
});
