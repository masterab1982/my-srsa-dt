import {
  GoogleGenAI,
  Chat,
  Content,
  HarmCategory,
  HarmBlockThreshold,
  GenerateContentConfig,
  Part, // Added for type safety if needed, though Content already implies it.
  GenerateContentResponse, // Correct type for stream chunks
  GroundingChunk, // For typing grounding chunks
} from "@google/genai";
import { marked } from "marked";

// Ensure API_KEY is handled as per guidelines (must be from process.env)
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is not set. Please set the API_KEY environment variable.");
  const errorDiv = document.getElementById('error-message') as HTMLDivElement;
  if (errorDiv) {
    errorDiv.textContent = "API_KEY is not configured. Please check the console.";
    errorDiv.style.display = 'block';
  }
  // Prevent further execution if API key is missing
  throw new Error("API_KEY not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const modelName = 'gemini-2.5-flash-preview-04-17'; // Updated model name

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
];

const systemInstructionText = `**التعليمات للنموذج:**
انا مساعد متخصص في تحليل وثائق استراتيجة التحول الرقمي وموؤمتها مع رؤية المملكة 2030 واهدفها لهيئة الهلال الاحمر السعودي. **مهمتك الأساسية هي الإجابة على الأسئلة المتعلقة حصراً باستراتيجية التحول الرقمي لهيئة الهلال الأحمر السعودي ومواءمتها مع رؤية المملكة 2030. إذا كان السؤال خارج هذا النطاق، يجب عليك الرد بأنك متخصص فقط في هذه المواضيع ("أنا مساعد ذكاء اصطناعي متخصص في تحليل استراتيجية التحول الرقمي لهيئة الهلال الأحمر السعودي ومواءمتها مع رؤية المملكة 2030. لا يمكنني الإجابة على أسئلة خارج هذا النطاق.") وعدم محاولة الإجابة أو البحث.** إذا كان السؤال ضمن نطاقك، قم بالإجابة عليه بدقة وتفصيل. إذا كانت بعض جوانب السؤال لا يمكن الإجابة عليها من السياق أو البحث، اذكر ذلك بوضوح. قم بتنظيم الإجابة بحيث يتم العرض بشكل واضح ومرتب. **يرجى استخدام تنسيق Markdown لتقديم الإجابة بشكل منظم، مثل القوائم النقطية أو الرقمية، والنص العريض، والجداول إذا كانت مناسبة.** ولاتذكر بناء على السياق في الاجابة . في حال لايتضمن السياق او نتائج البحث الاجابة اذكر انه لايمكنك الاجابة على هذا السؤال حاليا ولاتذكر السياق ومايوجد فيه نهائيا. اذا استخدمت البحث، اذكر المصادر.
---
**السياق **
**الرؤية العامة للتحول الرقمي (كمقدمة للسياق إذا كانت ذات صلة مباشرة بالأهداف):**
خدمات إسعافية موثوقة ومستدامة من خلال حلول رقمية متميزة وإبداعية.
**الرسالة العامة للتحول الرقمي (كمقدمة للسياق إذا كانت ذات صلة مباشرة بالأهداف):**
نسعى إلى التميز والإبداع في الحلول الرقمية لتمكين الريادة في حفظ الأرواح وتقديم خدمات إسعافية موثوقة ومستدامة.
**الأهداف الاستراتيجية للتحول الرقمي ووصفها:**
1.  **الهدف الاستراتيجي 1.1: تعزيز الأمن والحماية للأنظمة والشبكات**
    * **الوصف:** وتعزيز الأمن والحماية للأنظمة التطبيقات والشبكات ومراكز البيانات وباقي مكونات البنية الرقمية من خلال تفعيل وتبني ممارسات الأمن السيبراني لتوفير منتجات وخدمات آمنة لجميع المستفيدين من خلال إنشاء وتفعيل وحماية مراكز البيانات ومراكز المراقبة وتعزيز استمرارية شبكة الاتصالات, الأنظمة والخوادم، و التخزين والنسخ الاحتياطي والالتزام بمعايير الهيئة الوطنية للأمن السيبراني.
2.  **الهدف الاستراتيجي 1.2: تبني الحوسبة السحابية وتحسين البنية الرقمية**
    * **الوصف:** تبني الحوسبة السحابية من خلال تطوير ممارسات فعالة للتحول للبنية السحابية بالإضافة إلى تحسين وتطوير البنية التحتية الرقمية لتلبية احتياجات الهيئة وتضمن تحقيق أهداف استراتيجية التحول الرقمي بالهيئة.
3.  **الهدف الاستراتيجي 1.3: تعزيز كفاءة وموثوقية الخدمات والحلول الرقمية**
    * **الوصف:** العمل على توفير خدمات رقمية ذات كفاءة وموثوقية عالية من خلال تحسين الاعتمادية والموثوقية للخدمات ذات الأولوية بما يضمن تحسين جودة الخدمات ودعم الحلول الرقمية لضمان استمرارية الخدمة الاسعافية بلا انقطاع.
4.  **الهدف الاستراتيجي 1.4: بيئة رقمية متكاملة**
    * **الوصف:** بناء منظومة تكامل رقمية (داخلية وخارجية) تخدم تطلعات الهيئة وتلبي تطلعات المستفيدين ويتم ذلك من خلال تضمين وتكامل ومشاركة جميع الجهات الصحية وباقي الجهات الحكومية بشكل الكتروني وفعال في الرحلة الإسعافية.
5.  **الهدف الاستراتيجي 2.1: تبني وتفعيل أفضل الممارسات في التحول الرقمي**
    * **الوصف:** تبني أفضل ممارسات التحول الرقمي ورفع الكفاءة والفعالية في إدارة وتنفيذ عملية التغيير – ورفع درجة الإلتزام بالسياسات والضوابط والمنهجية المعتمدة وحوكمة وإدارة العلاقة مع الشركاء في المجال التقني - تفعيل النموذج التشغيلي وتطبيق أفضل الممارسات لتشغيل وحوكمة التحول الرقمي وتحسين كفاءة الإنفاق في التحول الرقمي.
6.  **الهدف الاستراتيجي 2.2: تعظيم الاستفادة من أنظمة البيانات لدعم اتخاذ القرار**
    * **الوصف:** دعم اتخاذ القرار بتوفير البيانات الصحيحة في التقارير والإحصائيات اللازمة بشكل مؤتمت يضمن سهولة الوصول للمعلومات والعمل على رفع جودتها وموثوقيتها.
7.  **الهدف الاستراتيجي 2.3: تعزيز وبناء القدرات والكفاءات في التحول الرقمي**
    * **الوصف:** تعزيز القدرات والكفاءات البشرية اللازمة للتحول الرقمي عن طريق التحليل المستمر لاحتياج الهيئة من قدرات وكفاءات التحول الرقمي والتأهيل والاستقطاب وبناء الشراكات اللازمة لبناء بيئة رقمية موثوقة ومستدامة.
8.  **الهدف الاستراتيجي 3.1: تحسين تجربة المستفيدين الرقمية**
    * **الوصف:** تحسين تجربة المستفيدين وضمان سهولة الوصول والاستخدام للخدمات الإلكترونية المقدمة للمستفيدين بجميع فئاتهم و تطبيق ممارسات تعزيز رضا المستفيدين عن طريق الاستماع لآرائهم والاعتماد عليها في تحسين جودة الخدمات وتحسين جودة الإستجابة لطلبات الدعم التقنية.
9.  **الهدف الاستراتيجي 3.2: تبني احتياجات الأعمال الرقمية**
    * **الوصف:** الرصد والاستماع لاحتياجات المستفيدين الرقمية وتوثيقها والاستناد إليها لتطوير منتجات رقمية تلبي احتياجاتهم وتوقعاتهم من خلال العمل على تطويرها بطريقة تضمن توفير تجربة رقمية فريدة.
10. **الهدف الاستراتيجي 4.1: تبني الابتكار واستدامة البيئة الابتكارية**
    * **الوصف:** تبني الابتكار واستدامة البيئة الابتكارية - ابتكار منتجات وخدمات وحلول ابتكارية وقياس أثر الاستدامة لتلك الحلول الابتكارية ومتابعة تحسينها بشكل مستمر من خلال اعتماد آليات للتعاون والتواصل والشراكة مع جهات ومراكز ومختبرات البحث والابتكار - المشاركة في فعاليات الابتكار المفتوح مثل الهاكاثونات والمسابقات والورش المتخصصة توثيق الأفكار الإبداعية وحالات الاستخدام القابلة للتطبيق.
11. **الهدف الاستراتيجي 4.2: تطوير الحلول الإبتكارية باستخدام التقنيات الناشئة**
    * **الوصف:** تطوير الحلول الإبتكارية واستخدام التقنيات الناشئة لتحسين الخدمات الالكترونية بهدف تمكين الخدمات الإسعافية وباقي أعمال الهيئة وإضافة قيمة من أجل بيئة رقمية موثوقة.
---
**السؤال (1) المطلوب الإجابة عليه:**
ما هي الأهداف الاستراتيجية للتحول الرقمي ووصفها بالتفصيل في الهيئة؟
---
**الإجابة المتوقعة من النموذج:**
[اترك هذا القسم فارغًا، سيقوم النموذج بتعبئته]
------------------------------------------------
**السياق **
الركائز الاستراتيجية للتحول الرقمي والأهداف المرتبطة بها كما ورد في "البيت الاستراتيجي للتحول الرقمي" وجداول الأهداف:
1.  **الركيزة: بيئة موثوقة**
    * الهدف 1.1: تعزيز الأمن والحماية للأنظمة والشبكات
    * الهدف 1.2: تبني الحوسبة السحابية وتحسين البنية الرقمية
    * الهدف 1.3: تعزيز كفاءة وموثوقية الخدمات والحلول الرقمية
    * الهدف 1.4: بيئة رقمية متكاملة
2.  **الركيزة: منظومة تشغيلية متميزة**
    * الهدف 2.1: تبني وتفعيل أفضل الممارسات في التحول الرقمي
    * الهدف 2.2: تعظيم الاستفادة من أنظمة البيانات لدعم اتخاذ القرار
    * الهدف 2.3: تعزيز وبناء القدرات والكفاءات في التحول الرقمي
3.  **الركيزة: تجربة رقمية فريدة**
    * الهدف 3.1: تحسين تجربة المستفيدين الرقمية
    * الهدف 3.2: تبني احتياجات الأعمال الرقمية
4.  **الركيزة: حلول ابتكارية** (مشار إليها أيضًا في سياق "كفاءات متميزة ومبدعة")
    * الهدف 4.1: تبني الابتكار واستدامة البيئة الابتكارية
    * الهدف 4.2: تطوير الحلول الإبتكارية باستخدام التقنيات الناشئة
---
**السؤال المطلوب الإجابة عليه:**
ما هي الركائز الاستراتيجية للتحول الرقمي وارتباطها بالأهداف الاستراتيجية في الهيئة؟
---
**الإجابة المتوقعة من النموذج:**
[اترك هذا القسم فارغًا، سيقوم النموذج بتعبئته]
----------------------------------------------------------------------------------------
قم بتنظيم الإجابة لكل مبادرة استراتيجية مذكورة في السياق على النحو التالي:
1.  **اسم المبادرة:** (مع ذكر رمزها إذا وجد)
2.  **وصف المبادرة:** (اشرح الهدف العام للمبادرة)
3.  **الأهداف الاستراتيجية المرتبطة بالتحول الرقمي:** (اذكر الأهداف الاستراتيجية التي تساهم هذه المبادرة في تحقيقها , رتبها في نقاط )
4.  **أثر المبادرة في سد الفجوات ذات الصلة:** (لخص كيف تساهم هذه المبادرة في معالجة الفجوات, رتبها في نقاط)
5.  **إجمالي التكلفة التقديرية للمبادرة:** (اذكر التكلفة إذا كانت متوفرة في السياق)
---
**السياق **
**1. اسم المبادرة ورمزها:** مبادرة تطوير الحلول الرقمية للخدمات الاسعافية (MA01)
* **وصف المبادرة:** تهدف هذه المبادرة إلى تعزيز البنية الرقمية للخدمات الإسعافية من خلال تطوير الأنظمة والتطبيقات الإلكترونية وتكاملها بالأنظمة الداخلية والخارجية، بهدف تسهيل الوصول إلى الخدمات الرقمية للمستفيدين وتحسين جودة الخدمات الإسعافية وتعزيز الشفافية والحوكمة.
* **الأهداف الاستراتيجية المرتبطة بالتحول الرقمي:** تحسين تجربة المستفيدين الرقمية؛ تبني احتياجات الأعمال الرقمية؛ بيئة رقمية متكاملة.
* **أثر المبادرة في سد الفجوات ذات الصلة:** تطوير وتحسين الخدمات الاسعافية الرقمية للمساهمة في تقليل زمن الاستجابة؛ تعزيز موثقية واستدامة الخدمات الاسعافية؛ اتمتتة الخدمات الاسعافية ورفع النضج الرقمي للهيئة؛ تطوير منظومة التكامل الداخلي والخارجي لتحسين جودة التقارير والبيانات؛ تعزيز الامن والمراقبة للسيارات الاسعافية؛ اكتمال منظومة الهيئة الرقمية لتمكين الخدمات الاسعافية؛ تطوير الانظمة والتطبيقات الحالية والمستمرة لتلبي احتياجات تمكين الخدمات الاسعافية؛ رفع رضا منسوبي الهيئة للخدمات الاسعافية من خلال تحسين تجربة المستفيد الرقمية.
* **إجمالي التكلفة التقديرية للمبادرة:** 79,513,998 ر.س.‏
... (Rest of the extensive system instruction context from the Python script) ...
---------------------------------------------------------------`;


const initialHistory: Content[] = [
  { role: "user", parts: [{ text: "من انت ؟" }] },
  { role: "model", parts: [{ text: "أنا مساعد متخصص في تحليل وثائق استراتيجية التحول الرقمي ومواءمتها مع رؤية المملكة 2030 وأهدافها لهيئة الهلال الأحمر السعودي." }] },
  { role: "user", parts: [{ text: "ماهي الرؤية" }] },
  { role: "model", parts: [{ text: "خدمات إسعافية موثوقة ومستدامة من خلال حلول رقمية متميزة وإبداعية." }] },
  { role: "user", parts: [{ text: "اذكر مشاريع التحول الرقمي من غير تفاصيل" }] },
  { role: "model", parts: [{ text: "مشاريع التحول الرقمي هي:\n\n1.  تطوير نظام المعلومات الجغرافية لتحليل البيانات والمعلومات المكانية (PR-01)\n2.  تطوير نظام ادارة البلاغات الاسعافية (PR-02)\n3.  تطوير انظمة التحكم والمراقبة والامان لسيارات الاسعاف (PR-03)\n4.  تطوير النظام والمنصة الموحدة لاداراة الاختبارات والتدريب (PR-04)\n5.  تطوير الانظمة الرقمية الداعمة لاتمتة الخدمات المساندة (PR-05)\n6.  تطوير انظمة الموارد الحكومية (مصادر) (PR-06)\n7.  تطوير منصة ونظام ادرة التطوع الاسعافي (PR-07)\n8.  تطوير أنظمة ادارة الحوكمة والمخاطر والامتثال (PR-08)\n9.  دمج وتحسين وتطوير المنصات الخارجية لهيئة الهلال الاحمر السعودي لتوفير تجربة مستخدم سلسة وفعالة (PR-09)\n10. تطوير نظام ادارة علاقات العملاء لتعزيز التواصل بين الهيئة والمستفيدين (PR-10)\n11. تطوير منظومة التكامل الموحد للخدمات الداخلية والخارجية (PR-12)\n12. تطوير وتحسين خدمات البنية التحتية (PR-13)\n13. تحسين الكفاءة التشغيلية من خلال الانتقال إلى الحوسبة السحابية (PR-14)\n14. الخدمات الاستشارية لتطوير استراتيجية الحوسبة السحابية (PR-15)\n15. مشروع الاستجابة والتعافي من الأزمات والكوارث (PR-16)\n16. تطوير وتعزيز البنية التحتية للأمن والسلامة (PR-17)\n17. تطوير وتعزيز الامن السيبرانى للانظمة والبنية التحتية (PR-18)\n18. توفير الاحتياجات الرقمية لاعمال التشغيل (PR-19)\n19. تطوير المهارات الرقمية وتأهيل منسوبين وقيادات التحول الرقمي (PR-20)\n20. تشغيل ودعم تقنية المعلومات للمركز الرئيسي والفروع (PR-21)\n21. توثيق واعادة هندسة الإجراءات والعمليات لخدمات الاعمال الرقمية (PR-22)\n22. تأسيس وتشغيل إدارة الجودة ومراقبة الاداء (PR-23)\n23. تفعيل ممارسات الحوكمة الرقمية (PR-24)\n24. اقامة الفعاليات وبناء الشراكات لتبني البيئة الابتكارية في التحول الرقمي (PR-25)\n25. تفعيل التقنيات الناشئة لتطوير وتحسين الخدمات الاسعافية (PR-26)\n26. تطوير منظومة وأدوات البيانات (PR-27)\n27. تطوير نظام المستجيب (PR-28)" }] },
  { role: "user", parts: [{ text: "ماهي مشاريع السنة الاولى" }] },
  { role: "model", parts: [{ text: "مشاريع السنة الأولى هي:\n\n1.  **رقم المشروع:** PR-02\n    *   **اسم المشروع الاستراتيجي:** تطوير نظام ادارة البلاغات الاسعافية\n    *   **التكلفة التقديرية (المبلغ):** 59,017,998 ر.س.‏\n    *   **درجة الأولوية:** عالي جدا\n2.  **رقم المشروع:** PR-12\n    *   **اسم المشروع الاستراتيجي:** تطوير منظومة التكامل الموحد للخدمات الداخلية والخارجية\n    *   **التكلفة التقديرية (المبلغ):** 13,208,000 ر.س.‏\n    *   **درجة الأولوية:** عالي جدا\n3.  **رقم المشروع:** PR-13\n    *   **اسم المشروع الاستراتيجي:** تطوير وتحسين خدمات البنية التحتية\n    *   **التكلفة التقديرية (المبلغ):** 100,999,363 ر.س.‏\n    *   **درجة الأولوية:** عالي جدا\n4.  **رقم المشروع:** PR-14\n    *   **اسم المشروع الاستراتيجي:** تحسين الكفاءة التشغيلية من خلال الانتقال إلى الحوسبة السحابي\n    *   **التكلفة التقديرية (المبلغ):** 45,238,500 ر.س.‏\n    *   **درجة الأولوية:** عالي جدا\n5.  **رقم المشروع:** PR-27\n    *   **اسم المشروع الاستراتيجي:** تطوير منظومة وأدوات البيانات\n    *   **التكلفة التقديرية (المبلغ):** 80,568,500 ر.س.‏\n    *   **درجة الأولوية:** عالي جدا\n6.  **رقم المشروع:** PR-22\n    *   **اسم المشروع الاستراتيجي:** توثيق واعادة هندسة الإجراءات والعمليات لخدمات الاعمال الرقمية\n    *   **التكلفة التقديرية (المبلغ):** 7,260,000 ر.س.‏\n    *   **درجة الأولوية:** عالي جدا\n7.  **رقم المشروع:** PR-18\n    *   **اسم المشروع الاستراتيجي:** تطوير وتعزيز الامن السيبرانى للانظمة والبنية التحتية\n    *   **التكلفة التقديرية (المبلغ):** 70,740,000.00 ر.س.‏\n    *   **درجة الأولوية:** عالي جدا\n8.  **رقم المشروع:** PR-28\n    *   **اسم المشروع الاستراتيجي:** تطوير نظام المستجيب\n    *   **التكلفة التقديرية (المبلغ):** 6,000,000 ر.س.‏\n    *   **درجة الأولوية:** متوسط\n9.  **رقم المشروع:** PR-21\n    *   **اسم المشروع الاستراتيجي:** تشغيل ودعم تقنية المعلومات للمركز الرئيسي والفروع\n    *   **التكلفة التقديرية (المبلغ):** 70,560,000 ر.س.‏\n    *   **درجة الأولوية:** متوسط\n10. **رقم المشروع:** PR-15\n    *   **اسم المشروع الاستراتيجي:** الخدمات الاستشارية لتطوير استراتيجية الحوسبة السحابية\n    *   **التكلفة التقديرية (المبلغ):** 2,733,500 ر.س.‏\n    *   **درجة الأولوية:** متوسط\n11. **رقم المشروع:** PR-10\n    *   **اسم المشروع الاستراتيجي:** تطوير نظام ادارة علاقات العملاء لتعزيز التواصل بين الهيئة والمستفيدين\n    *   **التكلفة التقديرية (المبلغ):** 4,986,000 ر.س.‏\n    *   **درجة الأولوية:** متوسط\n12. **رقم المشروع:** PR-06\n    *   **اسم المشروع الاستراتيجي:** تطوير انظمة الموارد الحكومية - مصادر\n    *   **التكلفة التقديرية (المبلغ):** 8,057,500 ر.س.‏\n    *   **درجة الأولوية:** متوسط\n13. **رقم المشروع:** PR-08\n    *   **اسم المشروع الاستراتيجي:** تطوير أنظمة ادارة الحوكمة والمخاطر والامتثال\n    *   **التكلفة التقديرية (المبلغ):** 3,000,000 ر.س.‏\n    *   **درجة الأولوية:** متوسط\n\n**الإجمالي للسنة الأولى:** 13 مشروعًا، التكلفة الإجمالية: 472,369,361 ر.س.‏" }] },
 { role: "user", parts: [{ text: "ماهي مشاريع السنة الثانية" }] },
  { role: "model", parts: [{ text: "مشاريع السنة الثانية (2027) هي:\n\n1.  **رقم المشروع:** PR-01\n    *   **اسم المشروع الاستراتيجي:** تطوير نظام المعلومات الجغرافية لتحليل البيانات والمعلومات المكانية\n    *   **التكلفة التقديرية (المبلغ):** 14,496,000 ر.س.‏\n    *   **درجة الأولوية:** متوسط\n2.  **رقم المشروع:** PR-04\n    *   **اسم المشروع الاستراتيجي:** تطوير النظام والمنصة الموحدة لاداراة الاختبارات والتدريب\n    *   **التكلفة التقديرية (المبلغ):** 7,941,000 ر.س.‏\n    *   **درجة الأولوية:** متوسط\n3.  **رقم المشروع:** PR-05\n    *   **اسم المشروع الاستراتيجي:** تطوير الانظمة الرقمية الداعمة لاتمتة الخدمات المساندة\n    *   **التكلفة التقديرية (المبلغ):** 71,921,554 ر.س.‏\n    *   **درجة الأولوية:** متوسط\n4.  **رقم المشروع:** PR-07\n    *   **اسم المشروع الاستراتيجي:** تطوير منصة ونظام ادرة التطوع الاسعافي\n    *   **التكلفة التقديرية (المبلغ):** 2,990,000 ر.س.‏\n    *   **درجة الأولوية:** متوسط\n5.  **رقم المشروع:** PR-19\n    *   **اسم المشروع الاستراتيجي:** توفير الاحتياجات الرقمية لاعمال التشغيل\n    *   **التكلفة التقديرية (المبلغ):** 42,000,000 ر.س.‏\n    *   **درجة الأولوية:** متوسط\n6.  **رقم المشروع:** PR-20\n    *   **اسم المشروع الاستراتيجي:** تطوير المهارات الرقمية وتأهيل منسوبين وقيادات التحول الرقمي\n    *   **التكلفة التقديرية (المبلغ):** 3,600,000 ر.س.‏\n    *   **درجة الأولوية:** متوسط\n7.  **رقم المشروع:** PR-23\n    *   **اسم المشروع الاستراتيجي:** تأسيس وتشغيل إدارة الجودة ومراقبة الاداء\n    *   **التكلفة التقديرية (المبلغ):** 4,465,500 ر.س.‏\n    *   **درجة الأولوية:** متوسط\n8.  **رقم المشروع:** PR-26\n    *   **اسم المشروع الاستراتيجي:** تفعيل التقنيات الناشئة لتطوير وتحسين الخدمات الاسعافية\n    *   **التكلفة التقديرية (المبلغ):** 52,031,000.00 ر.س.‏\n    *   **درجة الأولوية:** متوسط\n9.  **رقم المشروع:** PR-03\n    *   **اسم المشروع الاستراتيجي:** تطوير انظمة التحكم والمراقبة والامان لسيارات الاسعاف\n    *   **التكلفة التقديرية (المبلغ):** 47,000,000 ر.س.‏\n    *   **درجة الأولوية:** متوسط\n\n**الإجمالي للسنة الثانية (2027):** 9 مشاريع، التكلفة الإجمالية: 246,445,054 ر.س.‏" }] },
  { role: "user", parts: [{ text: "ماهي مشاريع السنة الثالثة" }] },
  { role: "model", parts: [{ text: "مشاريع السنة الثالثة (2028) هي:\n\n1.  **رقم المشروع:** PR-09\n    *   **اسم المشروع الاستراتيجي:** دمج وتحسين وتطوير المنصات الخارجية لهيئة الهلال الاحمر السعودي لتوفير تجربة مستخدم سلسة وفعالة\n    *   **التكلفة التقديرية (المبلغ):** 11,784,000 ر.س.‏\n    *   **درجة الأولوية:** متوسط\n2.  **رقم المشروع:** PR-16\n    *   **اسم المشروع الاستراتيجي:** مشروع الاستجابة والتعافي من الأزمات والكوارث\n    *   **التكلفة التقديرية (المبلغ):** 11,866,707 ر.س.‏\n    *   **درجة الأولوية:** متوسط\n3.  **رقم المشروع:** PR-17\n    *   **اسم المشروع الاستراتيجي:** تطوير وتعزيز البنية التحتية للأمن السلامة\n    *   **التكلفة التقديرية (المبلغ):** 63,368,750 ر.س.‏\n    *   **درجة الأولوية:** متوسط\n4.  **رقم المشروع:** PR-24\n    *   **اسم المشروع الاستراتيجي:** تفعيل ممارسات الحوكمة الرقمية\n    *   **التكلفة التقديرية (المبلغ):** 26,071,500.00 ر.س.‏\n    *   **درجة الأولوية:** متوسط\n5.  **رقم المشروع:** PR-25\n    *   **اسم المشروع الاستراتيجي:** اقامة الفعاليات وبناء الشراكات لتبني البيئة الابتكارية في التحول الرقمي\n    *   **التكلفة التقديرية (المبلغ):** 8,516,000.00 ر.с.‏\n    *   **درجة الأولوية:** متوسط\n\n**الإجمالي للسنة الثالثة (2028):** 5 مشاريع، التكلفة الإجمالية: 121,606,957 ر.س.‏" }] },
  { role: "user", parts: [{ text: "ماهي رؤية التحول الرقمي لهيئة الهلال الاحمر السعودي" }] },
  { role: "model", parts: [{ text: "الرؤية العامة للتحول الرقمي لهيئة الهلال الأحمر السعودي هي: **خدمات إسعافية موثوقة ومستدامة من خلال حلول رقمية متميزة وإبداعية.**" }] },
];

const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
const sendButton = document.getElementById('send-button') as HTMLButtonElement;
const chatOutput = document.getElementById('chat-output') as HTMLDivElement;
const loadingIndicator = document.getElementById('loading-indicator') as HTMLDivElement;
const errorMessageDiv = document.getElementById('error-message') as HTMLDivElement;
const suggestedQuestionsButtonsContainer = document.getElementById('suggested-questions-buttons') as HTMLDivElement;

let chat: Chat;
let chatConfig: GenerateContentConfig; // Store chat config for potential reuse

// Configure marked
marked.setOptions({
  breaks: true, // Convert single newlines in Markdown to <br>
  gfm: true, // Enable GitHub Flavored Markdown
});

function appendMessage(text: string, sender: 'user' | 'model' | 'error', isStreaming: boolean = false) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('chat-message', `${sender}-message`);
  
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('message-content');

  if (sender === 'model' || (sender === 'error' && text.startsWith('أنا مساعد ذكاء اصطناعي متخصص'))) { // Allow Markdown for the specific off-topic message
    contentDiv.innerHTML = marked.parse(text) as string;
  } else {
    const sanitizedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
    contentDiv.innerHTML = sanitizedText.replace(/\n/g, '<br>');
  }

  messageDiv.appendChild(contentDiv);

  if (isStreaming && sender === 'model') {
    messageDiv.classList.add('streaming');
  }
  chatOutput.appendChild(messageDiv);
  chatOutput.scrollTop = chatOutput.scrollHeight;
}

function updateLastMessage(text: string, sender: 'model') {
  const lastMessage = chatOutput.querySelector(`.chat-message.${sender}-message.streaming`);
  if (lastMessage) {
    const contentDiv = lastMessage.querySelector('.message-content') as HTMLDivElement;
    if (contentDiv) {
      contentDiv.innerHTML = marked.parse(text) as string;
    }
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }
}

function finalizeStreamedMessage() {
  const streamingMessage = chatOutput.querySelector('.chat-message.model-message.streaming');
  if (streamingMessage) {
    streamingMessage.classList.remove('streaming');
  }
}

function displayGroundingSources(sources: GroundingChunk[]) {
    const lastMessageDiv = chatOutput.querySelector('.chat-message.model-message:last-child');
    if (lastMessageDiv && sources.length > 0) {
        const existingSourcesContainer = lastMessageDiv.querySelector('.message-sources');
        if (existingSourcesContainer) {
            existingSourcesContainer.remove();
        }

        const sourcesContainer = document.createElement('div');
        sourcesContainer.className = 'message-sources';
        sourcesContainer.setAttribute('aria-label', 'المصادر');
        
        const sourcesTitle = document.createElement('h5');
        sourcesTitle.textContent = 'المصادر:';
        sourcesContainer.appendChild(sourcesTitle);
        
        const sourcesList = document.createElement('ul');
        const uniqueSources = Array.from(new Map(sources.map(s => [s.web?.uri, s])).values())
                                  .filter(s => s.web && s.web.uri);


        uniqueSources.forEach(source => {
            if (source.web && source.web.uri) { 
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = source.web.uri;
                link.textContent = source.web.title || source.web.uri; 
                link.target = '_blank';
                link.rel = 'noopener noreferrer'; 
                listItem.appendChild(link);
                sourcesList.appendChild(listItem);
            }
        });

        if (sourcesList.hasChildNodes()) {
            sourcesContainer.appendChild(sourcesList);
            lastMessageDiv.appendChild(sourcesContainer);
            chatOutput.scrollTop = chatOutput.scrollHeight;
        }
    }
}


const suggestedQuestions = [
  "ماهي الرؤية العامة للتحول الرقمي؟",
  "ما هي الأهداف الاستراتيجية للتحول الرقمي؟",
  "اذكر مشاريع التحول الرقمي للسنة الأولى.",
  "ما هي الركائز الاستراتيجية للتحول الرقمي؟"
];

function displaySuggestedQuestions() {
  if (!suggestedQuestionsButtonsContainer) {
    console.warn('Suggested questions container not found.');
    return;
  }
  suggestedQuestionsButtonsContainer.innerHTML = ''; 

  suggestedQuestions.forEach(questionText => {
    const button = document.createElement('button');
    button.classList.add('suggested-question-btn');
    button.textContent = questionText;
    button.type = 'button'; 
    button.setAttribute('aria-label', `اطرح السؤال: ${questionText}`);
    button.addEventListener('click', () => {
      chatInput.value = questionText;
      sendMessage();
    });
    suggestedQuestionsButtonsContainer.appendChild(button);
  });
}


async function initializeChat() {
  chatConfig = {
      systemInstruction: systemInstructionText,
      temperature: 0.7, 
      safetySettings: safetySettings,
  };
  
  chat = ai.chats.create({
    model: modelName,
    history: initialHistory,
    config: chatConfig
  });
}

async function sendMessage() {
  const userInput = chatInput.value.trim();
  if (!userInput) return;

  appendMessage(userInput, 'user');
  chatInput.value = '';
  chatInput.disabled = true;
  sendButton.disabled = true;
  loadingIndicator.style.display = 'block';
  errorMessageDiv.style.display = 'none';

  // Keywords related to SRCA Digital Transformation context and Vision 2030
  const generalContextKeywords = [
      "تحول رقمي", "التحول الرقمي", "استراتيجية", "استراتيجيه", "رقمي", "رقمية",
      "هيئة الهلال الأحمر", "الهيئة", "هلال احمر", "هلال أحمر",
      "موائمة", "مواءمة", "وائم", "ارتباط", "علاقة بـ",
      "هدف استراتيجي", "أهداف استراتيجية", "الهدف", "الأهداف",
      "مشروع", "مشاريع",
      "مبادرة", "مبادرات",
      "ركيزة", "ركائز",
      "وصف", "اشرح", "تفاصيل", "ما هي", "اذكر", "لخص", "ملخص",
      "تكلفة", "ميزانية",
      "خطة", "خطط",
      "السنة الأولى", "السنة الثانية", "السنة الثالثة", "سنوات", "سنة",
      "خدمات إسعافية", "إسعافية", "اسعافية",
      "الأمن والحماية", "أمن سيبراني", "الامن السيبراني",
      "الحوسبة السحابية", "بنية تحتية", "بنية رقمية",
      "كفاءة وموثوقية", "جودة الخدمات",
      "بيئة رقمية متكاملة", "تكامل",
      "أفضل الممارسات", "حوكمة",
      "أنظمة بيانات", "بيانات", "اتخاذ القرار",
      "القدرات والكفاءات", "مهارات رقمية", "تدريب",
      "تجربة المستفيدين", "المستفيدين",
      "احتياجات الأعمال",
      "الابتكار", "ابتكارية", "تقنيات ناشئة"
  ];
  const visionKeywords = ["رؤية 2030", "Vision 2030", "رؤيه 2030"];

  const normalizedUserInput = userInput.toLowerCase();
  const isRelatedToGeneralContext = generalContextKeywords.some(kw => normalizedUserInput.includes(kw.toLowerCase())) ||
                                    /PR-\d{2}/i.test(userInput) || /MA\d{2}/i.test(userInput);
  const isRelatedToVision = visionKeywords.some(kw => normalizedUserInput.includes(kw.toLowerCase()));

  if (!isRelatedToGeneralContext && !isRelatedToVision) {
      const offTopicMessage = "أنا مساعد ذكاء اصطناعي متخصص في تحليل استراتيجية التحول الرقمي لهيئة الهلال الأحمر السعودي ومواءمتها مع رؤية المملكة 2030. لا يمكنني الإجابة على أسئلة خارج هذا النطاق.";
      // Using 'error' sender type for styling, but it's a controlled message
      appendMessage(offTopicMessage, 'model'); // Changed to 'model' for consistent styling with Markdown
      loadingIndicator.style.display = 'none';
      chatInput.disabled = false;
      sendButton.disabled = false;
      chatInput.focus();
      chatOutput.scrollTop = chatOutput.scrollHeight;
      return; 
  }

  let currentResponseText = '';
  let allGroundingSources: GroundingChunk[] = [];

  try {
    const messageConfig: GenerateContentConfig = { }; 
    
    // Use search only if Vision 2030 keywords are present and the query passed the general relevance filter
    const shouldUseSearch = isRelatedToVision; 

    if (shouldUseSearch) {
      // Adhering to the guideline structure {googleSearch: {}} and using type assertion to resolve TS error.
      messageConfig.tools = [{googleSearch: {}} as any];
    }

    const stream: AsyncIterable<GenerateContentResponse> = await chat.sendMessageStream({ 
        message: userInput, 
        config: messageConfig 
    });
    
    if (!chatOutput.querySelector('.chat-message.model-message.streaming')) {
        appendMessage('', 'model', true); 
    }

    for await (const chunk of stream) { 
      const chunkText = chunk.text;
      if (chunkText) {
        currentResponseText += chunkText;
        if (!chatOutput.querySelector('.chat-message.model-message.streaming')) {
            appendMessage(currentResponseText, 'model', true);
        } else {
            updateLastMessage(currentResponseText, 'model');
        }
      }
      const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata?.groundingChunks && groundingMetadata.groundingChunks.length > 0) {
        allGroundingSources.push(...groundingMetadata.groundingChunks);
      }
    }
    finalizeStreamedMessage(); 
    if (allGroundingSources.length > 0) {
        displayGroundingSources(allGroundingSources);
    }

  } catch (error) {
    console.error("Error sending message:", error);
    const message = error instanceof Error ? error.message : String(error);
    errorMessageDiv.textContent = `خطأ: ${message}`;
    errorMessageDiv.style.display = 'block';
    appendMessage(`عفواً، حدث خطأ أثناء محاولة معالجة طلبك: ${message}`, 'error');
    finalizeStreamedMessage(); 
  } finally {
    loadingIndicator.style.display = 'none';
    chatInput.disabled = false;
    sendButton.disabled = false;
    chatInput.focus();
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }
}

sendButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

initializeChat().then(() => {
    if (chatConfig.responseMimeType && chatConfig.tools?.some(tool => (tool as any).googleSearch)) {
        console.warn("responseMimeType is set in chatConfig but googleSearch tool is active. This might cause issues if responseMimeType is 'application/json'.");
    }
}).catch(err => {
    console.error("Failed to initialize chat:", err);
    const message = err instanceof Error ? err.message : String(err);
    errorMessageDiv.textContent = `فشل تهيئة الدردشة: ${message}`;
    errorMessageDiv.style.display = 'block';
});
displaySuggestedQuestions();