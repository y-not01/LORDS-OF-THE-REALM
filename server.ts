import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize GoogleGenAI if key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Procedural backup narrative event generator
function generateProceduralEvent(state: any, language: string = 'en') {
  if (language === 'zh') {
    const zhEvents = [
      {
        title: '自由城邦商队恳请赐予通商特许',
        description: '来自自由城邦的巨贾富商长跪御前，恳求主公恩准其车队享有王家通商大道的专营权，并愿献上丰厚金银以充国库。',
        category: '商贸与外交',
        options: [
          {
            text: '赐予王家贸易专营特许状 (+120 金币, -5 稳定度)',
            impact: { gold: 120, stability: -5, prestige: 5 },
            consequence: '成箱金币填入国库，但本地工匠行会因特权垄断而微有怨言。',
          },
          {
            text: '严禁垄断，按例征收行商重税 (+60 金币, +10 粮食)',
            impact: { gold: 60, food: 10, stability: 2 },
            consequence: '商旅虽有不甘但仍按律纳粮缴税，为领地充实了粮秣。',
          },
          {
            text: '驱逐外邦商贾，庇护本地工商业 (+15 威望, +10 稳定度)',
            impact: { prestige: 15, stability: 10, gold: -20 },
            consequence: '全境工匠行会欢呼主公仁德，领民赞颂您为公道正直之明主。',
          },
        ],
      },
      {
        title: '边陲林地匪患与密探密报',
        description: '边境巡防长官急报，一伙披坚执锐之强盗袭扰了边陲村落。密探从俘虏身上搜出了铸有邻近诸侯徽记的银币。',
        category: '军事与谋略',
        options: [
          {
            text: '遣骑士精锐进山清剿盗匪 (-15 士兵, +20 威望)',
            impact: { soldiers: -15, prestige: 20, stability: 8 },
            consequence: '铁骑踏平贼巢，缴获大量粮饷兵械，边陲安居乐业。',
          },
          {
            text: '筑造边塞烽燧坚壁清野 (-50 金币, +15 城防)',
            impact: { gold: -50, stability: 12, prestige: 5 },
            consequence: '巍峨石楼哨卡拔地而起，宵小之徒望而生畏，不敢逾越。',
          },
          {
            text: '密遣使者重金诱其袭扰敌邦 (-40 金币, -5 稳定度)',
            impact: { gold: -40, stability: -5, prestige: -10 },
            consequence: '盗匪收受银两，旋即倒戈袭扰敌国封邑，为主公牵制邻邦兵力。',
          },
        ],
      },
      {
        title: '仲秋麦浪金黄 · 庆典还是屯粮',
        description: '今年秋季各行省五谷丰登，麦穗沉甸。枢密内阁齐聚议事大殿，奏请主公定夺今岁秋粮大计。',
        category: '王国丰稔',
        options: [
          {
            text: '举办全境欢庆大宴，赐酒封臣百姓 (-30 粮食, +35 威望, +15 稳定度)',
            impact: { food: -30, prestige: 35, stability: 15 },
            consequence: '赞颂主公仁德慷慨的歌谣传遍酒肆与乡野，万民归心。',
          },
          {
            text: '深筑太仓，封存以御严冬饥馑 (+80 粮食, +5 稳定度)',
            impact: { food: 80, stability: 5 },
            consequence: '每一座粮仓皆堆满干燥谷物，全境纵历酷寒亦无饥馑之虞。',
          },
          {
            text: '售粮于邻邦换取军费黄金 (+90 金币, +10 威望)',
            impact: { gold: 90, prestige: 10, food: -20 },
            consequence: '满载谷物的辎重车队换回大批沉甸金币，邻邦诸侯无不羡慕。',
          },
        ],
      },
    ];
    return zhEvents[Math.floor(Math.random() * zhEvents.length)];
  }

  const events = [
    {
      title: 'Merchant Caravans Seek Royal Charter',
      description: 'Wealthy burghers from the Free Cities petition your court for exclusive trading privileges along the royal highway in exchange for an immediate treasury tribute.',
      category: 'Diplomacy & Trade',
      options: [
        {
          text: 'Grant royal trade monopoly (+120 Gold, -5 Stability)',
          impact: { gold: 120, stability: -5, prestige: 5 },
          consequence: 'Gold pours into your coffers, though local guildmasters grumble at foreign merchant privileges.',
        },
        {
          text: 'Tax the trade strictly without granting monopolies (+60 Gold, +10 Food)',
          impact: { gold: 60, food: 10, stability: 2 },
          consequence: 'The merchants begrudgingly pay transit duties, providing steady supplies to local granaries.',
        },
        {
          text: 'Expel the cartel to protect local guilds (+15 Prestige, +10 Stability)',
          impact: { prestige: 15, stability: 10, gold: -20 },
          consequence: 'Your townsfolk cheer your defense of local craftsmen, hailing you as a just protector.',
        },
      ],
    },
    {
      title: 'Whispers of Border Smugglers & Bandits',
      description: 'Reports reach your council of heavily armed brigands raiding farming hamlets near the frontier. Some whisper they carry coin stamped with rival insignias.',
      category: 'Military Intrigue',
      options: [
        {
          text: 'Dispatch the cavalry garrison to scour the woods (-30 Soldiers, +20 Prestige)',
          impact: { soldiers: -15, prestige: 20, stability: 8 },
          consequence: 'Your mounted men-at-arms root out the brigand den, recovering stolen supplies and restoring order.',
        },
        {
          text: 'Fortify local border watchtowers (-50 Gold, +15 Defense)',
          impact: { gold: -50, stability: 12, prestige: 5 },
          consequence: 'Stout stone towers now overlook the treacherous trails, turning back raiders before they strike.',
        },
        {
          text: 'Bribe their chieftain to turn against rival borders (-40 Gold, -5 Stability)',
          impact: { gold: -40, stability: -5, prestige: -10 },
          consequence: 'The cutthroats accept your silver purse and redirect their raids toward your neighboring lord.',
        },
      ],
    },
    {
      title: 'Bountiful Autumn Harvest Feast',
      description: 'The autumn yields have exceeded all expectations. The peasants look to their lord to determine how the grand harvest shall be honored.',
      category: 'Realm Prosperity',
      options: [
        {
          text: 'Host a grand realm feast for nobility and commons (-30 Food, +35 Prestige, +15 Stability)',
          impact: { food: -30, prestige: 35, stability: 15 },
          consequence: 'Songs of your boundless generosity will be sung across taverns and hearths for winters to come.',
        },
        {
          text: 'Stock the royal granaries against winter famine (+80 Food, +5 Stability)',
          impact: { food: 80, stability: 5 },
          consequence: 'Every granary is sealed tight with dry grain; your subjects feel secure in facing harsh winters.',
        },
        {
          text: 'Sell surplus wheat to neighboring kingdoms (+90 Gold, +10 Prestige)',
          impact: { gold: 90, prestige: 10, food: -20 },
          consequence: 'Wagons laden with golden grain return filled with royal coin and praise from distant courts.',
        },
      ],
    },
    {
      title: 'Disputed Feudal Boundary Stones',
      description: 'A borderland reeve reports that stones demarcating your land have been moved inward under cover of midnight fog.',
      category: 'Territorial Dispute',
      options: [
        {
          text: 'Demand immediate apology and restoration (+15 Prestige, -10 Rival Opinion)',
          impact: { prestige: 15, stability: 5 },
          consequence: 'You assert your rightful feudal dominion firmly. The stones are moved back under armed watch.',
        },
        {
          text: 'Summon an arbitrator from the Holy Church (-25 Gold, +10 Stability)',
          impact: { gold: -25, stability: 10, prestige: 10 },
          consequence: 'The bishop confirms your ancient boundary parchment, sealing the accord in church law.',
        },
        {
          text: 'Mobilize troops to the border as a show of force (-20 Gold, +25 Prestige, -20 Rival Opinion)',
          impact: { gold: -20, prestige: 25, stability: -5 },
          consequence: 'Glittering spear tips line the crests; the rival lord hesitates before withdrawing their rangers.',
        },
      ],
    },
  ];

  const randomIndex = Math.floor(Math.random() * events.length);
  return events[randomIndex];
}

// API Route for AI-powered / contextual dynamic events
app.post('/api/chronicle/event', async (req, res) => {
  const language = req.body?.language || 'en';
  try {
    const { gameState } = req.body;

    if (!aiClient) {
      const proceduralEvent = generateProceduralEvent(gameState, language);
      return res.json({ success: true, event: proceduralEvent, source: 'procedural' });
    }

    const houseName = gameState?.playerHouse?.houseName || 'House Sterling';
    const leaderName = gameState?.playerHouse?.leaderName || 'Lord Alden';
    const gold = gameState?.resources?.gold ?? 250;
    const food = gameState?.resources?.food ?? 180;
    const soldiers = gameState?.resources?.soldiers ?? 120;
    const prestige = gameState?.resources?.prestige ?? 50;
    const stability = gameState?.stability ?? 75;
    const season = gameState?.season || 'Summer';
    const year = gameState?.year || 1192;
    const rivalSummary = gameState?.rivalLords?.map((r: any) => `${r.name} (${r.title}, Opinion: ${r.opinion})`).join(', ') || 'rival lords';

    let prompt = `You are the royal chronicler and feudal council for ${leaderName} of ${houseName}.
The current date is ${season}, ${year} AD.
Realm status:
- Gold: ${gold}
- Food: ${food}
- Soldiers: ${soldiers}
- Prestige: ${prestige}
- Stability: ${stability}%
Rival lords: ${rivalSummary}.

Generate a high-stakes, authentic medieval dilemma event for the lord.
The dilemma must have:
- A compelling title
- A rich medieval narrative description (2-3 sentences)
- Category (e.g., 'Diplomacy & Intrigue', 'Feudal Justice', 'Peasantry & Granary', 'Holy Church', 'Warfare')
- Exactly 3 diverse decision options. Each option must have:
  - 'text': concise description of the lord's choice and clear cost/benefit note
  - 'impact': an object with numeric modifiers for gold, food, soldiers, prestige, and stability
  - 'consequence': a 1-sentence narrative outcome if chosen.`;

    if (language === 'zh') {
      prompt += `\nCRITICAL: You MUST write the entire output (title, description, category, option text, and consequence) in immersive, elegant, literary Simplified Chinese (简体中文).`;
    }

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out')), 3000)
    );

    const response = await Promise.race([
      aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    consequence: { type: Type.STRING },
                    impact: {
                      type: Type.OBJECT,
                      properties: {
                        gold: { type: Type.NUMBER },
                        food: { type: Type.NUMBER },
                        soldiers: { type: Type.NUMBER },
                        prestige: { type: Type.NUMBER },
                        stability: { type: Type.NUMBER },
                      },
                    },
                  },
                  required: ['text', 'consequence', 'impact'],
                },
              },
            },
            required: ['title', 'description', 'category', 'options'],
          },
        },
      }),
      timeoutPromise,
    ]);

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.title || !parsed.options || parsed.options.length < 2) {
      throw new Error('Incomplete JSON from Gemini');
    }

    return res.json({ success: true, event: parsed, source: 'gemini' });
  } catch (error) {
    console.warn('Gemini chronicle generation fallback:', error);
    const proceduralEvent = generateProceduralEvent(req.body?.gameState, language);
    return res.json({ success: true, event: proceduralEvent, source: 'fallback' });
  }
});

// Setup Vite in Dev or serve Static in Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lords of the Realm server running at http://localhost:${PORT}`);
  });
}

startServer();
