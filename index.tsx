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

  // للتمرير للأسفل تلقائيًا عند إضافة رسالة جديدة
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
    
    // السجل الذي سيتم إرساله إلى الخادم هو المحادثة الظاهرة حاليًا
    const historyForAPI = [...messages];
    
    // أضف رسالة المستخدم الجديدة إلى الواجهة فورًا
    const userMessage: Message = { role: 'user', parts: [{ text: currentInput }] };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');


    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: historyForAPI,
          prompt: currentInput
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // إذا فشل الطلب، قم بإزالة رسالة المستخدم التي تم إضافتها
        setMessages(prev => prev.slice(0, -1));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      const modelMessage: Message = { role: 'model', parts: [{ text: data.text }] };

      // تحديث الواجهة برد النموذج بعد نجاح الطلب
      // نستبدل رسالة المستخدم الأخيرة التي أضفناها برسالة المستخدم + رد النموذج
      setMessages(prev => [...prev.slice(0, -1), userMessage, modelMessage]);


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
