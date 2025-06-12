import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI, Content, HarmCategory, HarmBlockThreshold } from '@google/genai';

// --- السياق الكامل والتعليمات الأساسية للنموذج ---
// ستبقى هذه التعليمات على الخادم بشكل دائم وآمن
const systemInstructionText = `**التعليمات للنموذج:**
انا مساعد متخصص في تحليل وثائق استراتيجة التحول الرقمي وموؤمتها مع رؤية المملكة 2030 واهدفها لهيئة الهلال الاحمر السعودي. مهمتك هي الإجابة على السؤال التالي بدقة وتفصيل، إذا كانت بعض جوانب السؤال لا يمكن الإجابة عليها من السياق، اذكر ذلك بوضوح. قم بتنظيم الإجابة بحيث يتم العرض بشكل واضح ومرتب. **يرجى استخدام تنسيق Markdown لتقديم الإجابة بشكل منظم، مثل القوائم النقطية أو الرقمية، والنص العريض، والجداول إذا كانت مناسبة.** ولاتذكر بناء على السياق في الاجابة . في حال لايتضمن السياق الاجابة اذكر انه لايمكنك الاجابة على هذا السؤال حاليا ولاتذكر السياق ومايوجد فيه نهائيا
---
**السياق **
**الرؤية العامة للتحول الرقمي (كمقدمة للسياق إذا كانت ذات صلة مباشرة بالأهداف):**
خدمات إسعافية موثوقة ومستدامة من خلال حلول رقمية متميزة وإبداعية.
**الرسالة العامة للتحول الرقمي (كمقدمة للسياق إذا كانت ذات صلة مباشرة بالأهداف):**
نسعى إلى التميز والإبداع في الحلول الرقمية لتمكين الريادة في حفظ الأرواح وتقديم خدمات إسعافية موثوقة ومستدامة.
**الأهداف الاستراتيجية للتحول الرقمي ووصفها:**
1.  **الهدف الاستراتيجي 1.1: تعزيز الأمن والحماية للأنظمة والشبكات**
2.  **الهدف الاستراتيجي 1.2: تبني الحوسبة السحابية وتحسين البنية الرقمية**
3.  **الهدف الاستراتيجي 1.3: تعزيز كفاءة وموثوقية الخدمات والحلول الرقمية**
4.  **الهدف الاستراتيجي 1.4: بيئة رقمية متكاملة**
5.  **الهدف الاستراتيجي 2.1: تبني وتفعيل أفضل الممارسات في التحول الرقمي**
6.  **الهدف الاستراتيجي 2.2: تعظيم الاستفادة من أنظمة البيانات لدعم اتخاذ القرار**
7.  **الهدف الاستراتيجي 2.3: تعزيز وبناء القدرات والكفاءات في التحول الرقمي**
8.  **الهدف الاستراتيجي 3.1: تحسين تجربة المستفيدين الرقمية**
9.  **الهدف الاستراتيجي 3.2: تبني احتياجات الأعمال الرقمية**
10. **الهدف الاستراتيجي 4.1: تبني الابتكار واستدامة البيئة الابتكارية**
11. **الهدف الاستراتيجي 4.2: تطوير الحلول الإبتكارية باستخدام التقنيات الناشئة**
---`;


export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('API key not configured on the server.');

        const { history, prompt } = req.body as { history: Content[], prompt: string };
        if (!prompt) throw new Error('A prompt is required.');

        const genAI = new GoogleGenerativeAI(apiKey);

        const model = genAI.getGenerativeModel({
             model: "gemini-1.5-flash-latest",
             systemInstruction: systemInstructionText, // استخدام الطريقة الرسمية لتحديد هوية النموذج
             safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
              ],
        });
        
        // بدء جلسة محادثة مع السجل السابق
        const chat = model.startChat({ history: history || [] });
        
        // إرسال الرسالة الجديدة فقط
        const result = await chat.sendMessage(prompt);
        const response = result.response;
        const text = response.text();

        return res.status(200).json({ text });

    } catch (error) {
        console.error('Error in API route:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return res.status(500).json({ error: errorMessage });
    }
}
