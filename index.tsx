import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { marked } from 'marked';

// تعريف أنواع البيانات للمحادثة
interface MessagePart {
  text: string;
}
interface Message {
  role: 'user' | 'model';
  parts: MessagePart[];
}

// --- السياق الكامل والتعليمات الأساسية ---
// سيتم إرسال هذا السياق مع كل طلب ولكنه لن يظهر في واجهة المستخدم
const FULL_CONTEXT_AND_INSTRUCTIONS = `**التعليمات للنموذج:**
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

// ---- تاريخ المحادثة المبدئي الذي يظهر للمستخدم ----
const initialDisplayedHistory: Message[] = [
    { role: "user", parts: [{ text: "من انت ؟" }] },
    { role: "model", parts: [{ text: "أنا مساعد متخصص في تحليل وثائق استراتيجية التحول الرقمي ومواءمتها مع رؤية المملكة 2030 وأهدافها لهيئة الهلال الأحمر السعودي." }] },
];

function App() {
  const [messages, setMessages] = useState<Message[]>(initialDisplayedHistory);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatOutputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatOutputRef.current) {
        chatOutputRef.current.scrollTop = chatOutputRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    const currentInput = userInput.trim();
    if (!currentInput || isLoading) return;

    setIsLoading(true);
    setError(null);
    setUserInput('');

    // إنشاء رسالة المستخدم الجديدة لعرضها في الواجهة
    const userMessageForUI: Message = { role: 'user', parts: [{ text: currentInput }] };
    
    // إنشاء سجل المحادثة الكامل الذي سيتم إرساله إلى API
    const conversationForAPI: Message[] = [
        { role: 'user', parts: [{ text: FULL_CONTEXT_AND_INSTRUCTIONS }] },
        // ... يمكنك إضافة رسائل "تدريبية" أخرى هنا إذا أردت
        ...messages, // إضافة المحادثة الظاهرة الحالية
        userMessageForUI // إضافة سؤال المستخدم الجديد
    ];

    // تحديث الواجهة برسالة المستخدم فورًا
    setMessages(prev => [...prev, userMessageForUI]);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation: conversationForAPI }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      const modelMessage: Message = { role: 'model', parts: [{ text: data.text }] };
      
      // تحديث الواجهة برد النموذج
      setMessages(prev => [...prev, modelMessage]);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
      // في حالة الخطأ، أزل رسالة المستخدم التي تم عرضها
       setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };
  
  marked.setOptions({ breaks: true, gfm: true });
  
  return (
    <div id="chat-container">
      <div id="chat-output" ref={chatOutputRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.role}-message`}>
            <div className="message-content" dangerouslySetInnerHTML={{ __html: marked.parse(msg.parts[0].text) as string }} />
          </div>
        ))}
        {isLoading && <div className="chat-message model-message loading"><span>.</span><span>.</span><span>.</span></div>}
      </div>
      {error && <div id="error-message">{error}</div>}
      <div id="chat-input-container">
        <textarea id="chat-input" value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="اكتب سؤالك هنا..." disabled={isLoading} />
        <button id="send-button" onClick={sendMessage} disabled={isLoading}>إرسال</button>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<React.StrictMode><App /></React.StrictMode>);
}
