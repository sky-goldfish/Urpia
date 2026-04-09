import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
export const discoveryRouter = Router();
discoveryRouter.post('/reveal', async (req, res) => {
    const { userId, poiId } = req.body;
    const poi = await prisma.poi.findUnique({ where: { id: poiId } });
    if (!poi) {
        return res.status(404).json({ error: { code: 'POI_NOT_FOUND', message: '当前地点不存在或已下线' } });
    }
    const discovery = await prisma.discovery.create({
        data: {
            userId,
            poiId,
            revealType: 'emotion-box',
            revealTitle: `在 ${poi.name} 遇见同频灵魂`,
            revealPayloadJson: JSON.stringify({
                description: poi.description,
                moodTags: JSON.parse(poi.moodTags)
            })
        }
    });
    res.json({
        discovery: {
            ...discovery,
            revealPayload: JSON.parse(discovery.revealPayloadJson)
        }
    });
});
