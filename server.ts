import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json());

// API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// AI Report analysis endpoint
app.post('/api/ai-report', async (req, res) => {
  const { sales, expenses, lowStock, customers, productsCount } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.status(400).json({ error: 'Gemini API key is not configured' });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `أنت مستشار مالي خبير ومحلل أعمال مخصص لقطاع التجزئة والمتاجر الصغيرة والمتوسطة.
قم بتحليل بيانات الأداء الحالية لهذا المتجر التجاري وتقديم تقرير مالي تشغيلي منظم، واضح ومختصر باللغة العربية مع توجيهات عملية لتحسين هوامش الربح وإدارة المستودعات.

إليك بيانات المتجر الحالية:
- إجمالي المبيعات المحققة (الإيرادات): ${sales} ر.س.
- إجمالي المصاريف التشغيلية (مثل الإيجار، الفواتير، الصيانة): ${expenses} ر.س.
- عدد السلع الكلية المسجلة بالمستودع: ${productsCount} سلعة.
- عدد العملاء المسجلين: ${customers} عميل.
- قائمة السلع الحالية التي تواجه كمية منخفضة (تحتاج لتوريد): ${lowStock && lowStock.length > 0 ? lowStock.join('، ') : 'لا يوجد سلع منخفضة'}

الرجاء تنظيم الإجابة في 3 أقسام رئيسية واضحة ومباشرة باستخدام Markdown:
1. 📈 تقييم العوائد والمبيعات (هل النسبة بين المصروفات والمبيعات جيدة؟ وما هو تعليقك؟)
2. ⚠️ حالة المخزون والمستودع (توجيهات مخصصة بناءً على السلع المنخفضة أو المستقرة)
3. 💡 توصيات تشغيلية ملموسة (نصيحتين عملية جداً لزيادة هوامش الأرباح والسيولة النقدية)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const reportText = response.text || 'عذراً! فشل في استخراج نص التقرير من خادم الذكاء الاصطناعي.';
    res.json({ report: reportText });

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'Failed to generate AI report due to backend error.' });
  }
});

// Setup Vite or production serving
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HisabApp Server] running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

bootstrap();
