// ============================================================
// JY AI 백엔드 서버 (Render.com 배포용 - Node.js/Express)
// 역할: 학생 화면(프론트엔드)의 요청을 대신 받아서,
//       안전하게 보관된 API 키로 Claude에게 물어보고 답을 돌려줍니다.
// ============================================================

const express = require('express');
const app = express();

app.use(express.json({ limit: '2mb' }));

// CORS 허용 (모든 출처 허용, 필요시 학생용 배포 주소로 좁힐 수 있음)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/', (req, res) => {
  res.send('JY AI 서버가 정상적으로 실행 중입니다.');
});

// 진단용: 서버가 실제로 읽고 있는 키의 길이/앞뒤 일부만 안전하게 확인 (전체 키는 노출 안 함)
app.get('/debug-key', (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY || '';
  res.json({
    exists: !!key,
    length: key.length,
    prefix: key.slice(0, 15),
    suffix: key.slice(-6),
    hasWhitespace: /\s/.test(key),
  });
});

app.post('/', async (req, res) => {
  try {
    const { system, message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'message가 필요합니다.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 8000,
        system: system || '',
        messages: [{ role: 'user', content: message }],
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`JY AI 서버 실행 중: 포트 ${PORT}`));
