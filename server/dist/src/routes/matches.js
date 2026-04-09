import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { buildChatRounds, scoreMatch } from '../lib/rules.js';
export const matchesRouter = Router();
matchesRouter.post('/', async (req, res) => {
    const { userId, discoveryId } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { persona: true } });
    const discovery = await prisma.discovery.findUnique({ where: { id: discoveryId }, include: { poi: true } });
    if (!user || !user.persona || !discovery) {
        return res.status(404).json({ error: { code: 'MATCH_CONTEXT_MISSING', message: '匹配上下文不存在' } });
    }
    const interestTags = JSON.parse(user.persona.interestTags);
    const poiMoodTags = JSON.parse(discovery.poi.moodTags);
    const score = scoreMatch(interestTags, poiMoodTags);
    const chatRounds = buildChatRounds(user.nickname, discovery.poi.name);
    const match = await prisma.match.create({
        data: {
            userId,
            targetProfileName: '暮色观察员',
            targetAvatarUrl: '/avatars/4c4eae51-6996-40bf-b175-5a2e692a1301.jpg',
            score,
            status: 'completed',
            reasonSummary: '你们在地点氛围和兴趣切入上高度一致。',
            chatRoundsJson: JSON.stringify(chatRounds),
            reportJson: JSON.stringify({
                label: score >= 80 ? '命中注定的相遇' : '有趣的灵魂',
                suggestion: '建议从地点感受开始继续聊天。'
            })
        }
    });
    res.json({
        match: {
            ...match,
            chatRounds,
            report: JSON.parse(match.reportJson)
        }
    });
});
matchesRouter.get('/:id', async (req, res) => {
    const match = await prisma.match.findUnique({ where: { id: req.params.id } });
    if (!match) {
        return res.status(404).json({ error: { code: 'MATCH_NOT_FOUND', message: '匹配结果不存在' } });
    }
    res.json({ match: { ...match, chatRounds: JSON.parse(match.chatRoundsJson) } });
});
matchesRouter.get('/:id/report', async (req, res) => {
    const match = await prisma.match.findUnique({ where: { id: req.params.id } });
    if (!match) {
        return res.status(404).json({ error: { code: 'MATCH_NOT_FOUND', message: '匹配结果不存在' } });
    }
    res.json({ report: { score: match.score, reasonSummary: match.reasonSummary, ...JSON.parse(match.reportJson) } });
});
