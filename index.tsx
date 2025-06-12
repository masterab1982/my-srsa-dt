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

// ---- تاريخ المحادثة المبدئي لتعريف النموذج ----
const initialHistory: Message[] = [
    { role: "user", parts: [{ text: "من انت ؟" }] },
    { role: "model", parts: [{ text: "انا مساعد متخصص في تحليل وثائق استراتيجية التحول الرقمي وموائمتها مع رؤية المملكة 2030 وأهدافها لهيئة الهلال الأحمر السعودي." }] },
];


function App() {
  const [messages, setMessages] = useState<Message[]>(initialHistory);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatOutputRef = useRef<HTMLDivElement>(null);

  // للتمرير للأسفل تلقائيًا عند إضافة رسالة جديدة
  useEffect(() => {
    if (chatOutputRef.current) {
        chatOutputRef.current.scrollTop = chatOutputRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const currentInput = userInput;
    const currentHistory = messages;

    setIsLoading(true);
    setError(null);
    setUserInput(''); // امسح مربع الإدخال فورًا لإعطاء شعور بالاستجابة

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: currentHistory, // أرسل السجل كما هو
          prompt: currentInput     // أرسل السؤال الحالي
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }
      
      const data = await response.json();

      // أنشئ رسالة المستخدم ورسالة النموذج معًا بعد نجاح الطلب
      const userMessage: Message = { role: 'user', parts: [{ text: currentInput }] };
      const modelMessage: Message = { role: 'model', parts: [{ text: data.text }] };

      // قم بتحديث المحادثة بإضافة الرسالتين معًا
      setMessages(prev => [...prev, userMessage, modelMessage]);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
      // في حالة الخطأ، أعد النص الذي كتبه المستخدم إلى مربع الإدخال
      setUserInput(currentInput);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // إعدادات مكتبة marked
  marked.setOptions({ breaks: true, gfm: true });
  
  return (
    <div id="chat-container">
      <div id="chat-output" ref={chatOutputRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.role}-message`}>
            <div
              className="message-content"
              dangerouslySetInnerHTML={{ __html: marked.parse(msg.parts[0].text) as string }}
            />
          </div>
        ))}
        {isLoading && <div className="chat-message model-message loading"><span>.</span><span>.</span><span>.</span></div>}
      </div>
      {error && <div id="error-message">{error}</div>}
      <div id="chat-input-container">
        <textarea
          id="chat-input"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="اكتب سؤالك هنا..."
          disabled={isLoading}
        />
        <button id="send-button" onClick={sendMessage} disabled={isLoading}>
          إرسال
        </button>
      </div>
    </div>
  );
}

// تأكد من أن لديك عنصر div بهذا الـ id في ملف index.html
const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<React.StrictMode><App /></React.StrictMode>);
}
