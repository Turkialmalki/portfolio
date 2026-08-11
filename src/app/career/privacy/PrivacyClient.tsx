"use client";

import TopBar from "@/components/TopBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { useLanguage } from "@/i18n/LanguageProvider";

const CONTACT_EMAIL = "turkialmalki202200@gmail.com";
const POLICY_VERSION = "2026-08-12";

type Section = { heading: string; body: string[] };

const COPY = {
  en: {
    eyebrow: "Career · Privacy",
    title: "Your CV is private.",
    intro:
      "This page explains, in plain language, what happens to your resume and career data when you use Turki's Career tools. It describes what is actually built today — not a marketing promise. Where something isn't built yet, it says so.",
    updated: `Last updated ${POLICY_VERSION}`,
    sections: [
      {
        heading: "Your CV is private",
        body: [
          "A resume usually contains your name, email, phone number, location, employment history, education, links, and other details that identify you. We treat all of it as private data belonging to you — not as marketing content, not as a shared example, not as something anyone else can browse.",
        ],
      },
      {
        heading: "What information we process",
        body: [
          "The CV file you upload, and the text extracted from it (name, contact details, employment history, education, links, and anything else it contains).",
          "Your account email, used to sign you in and to reach you about your own analysis or order.",
          "If you pay for a service, the payment reference you submit for verification (kept separately from your CV content — see \"Payments\" below).",
        ],
      },
      {
        heading: "Why we process it",
        body: [
          "To run the analysis or service you requested, generate your report, and let you access it again later.",
          "To verify a payment and unlock what you paid for.",
          "To respond to you if you contact us about your account or an order.",
        ],
      },
      {
        heading: "How AI is used",
        body: [
          "AI-powered analysis built around Turki's career review methodology. The AI does not decide the evaluation criteria on its own — the rubric and scoring logic come from that methodology. Your CV is sent from our server to the AI provider only for the specific analysis you requested; it is never sent directly from your browser.",
        ],
      },
      {
        heading: "What we do NOT do",
        body: [
          "We do not automatically add your CV, its analysis, or your rewrite drafts to training data, fine-tuning data, shared examples, a search/embeddings knowledge base, or evaluation datasets.",
          "We do not show your CV, analysis, or contact details to other customers.",
          "We do not generate a permanent public link to your CV. There is no URL anyone can browse to see it.",
          "Uploading a CV, paying for a service, creating an account, or using the scanner does not by itself count as permission to reuse your content — see \"Training & knowledge reuse\" below for what actually would.",
        ],
      },
      {
        heading: "Storage",
        body: [
          "Your CV file is stored in a private storage bucket. It is not public, and access is restricted at the database level so that only you — while signed in as yourself — can read or remove your own file. No one else's account, including an anonymous visitor, can read it, and guessing or knowing a file's internal path does not grant access.",
        ],
      },
      {
        heading: "Retention",
        body: [
          "Your CV and analysis are kept while your account is active, or until you ask us to delete them. Deleting your CV removes the stored file immediately. The related database records are marked deleted immediately and are never shown to you or used again, ahead of their scheduled permanent removal from our systems and backups.",
          "We are not going to promise a specific number of hours or days for permanent removal from backups until that exact schedule is fully automated end-to-end. What's true today: the deletion you request takes effect immediately for the file and for anything you or we can see or use afterward.",
        ],
      },
      {
        heading: "Training & knowledge reuse",
        body: [
          "Default: no reuse, for anyone. The only material that ever becomes part of Turki's career methodology knowledge base is: Turki's own CVs, examples Turki personally writes or approves, synthetic (made-up) examples, or a customer's material with your explicit, separate opt-in — after it has been anonymized and manually approved. Nothing you upload is added automatically, no matter what you paid for or agreed to when creating an account.",
        ],
      },
      {
        heading: "Payments",
        body: [
          "Payment and purchase-verification records are kept separately from your CV and analysis, for accounting, support, and fraud-prevention reasons — the same reason any paid service keeps a financial record even after other account data is deleted. Deleting your career data does not delete your payment history.",
        ],
      },
      {
        heading: "Deletion",
        body: [
          "You can ask us to delete your CV, or all of your career data, at any time. The deletion system already exists on our backend today; a self-serve button inside the product is coming next. Until it ships, email us (below) and we'll process the request through the same system a self-serve button would use.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          "You decide whether any of your material is ever used to improve Turki's career methodology — it's off by default, and if you ever opt in, you can withdraw that permission later. A withdrawal stops any future use of material that hasn't already been anonymized and approved; it does not undo an approved, anonymized example that no longer identifies you.",
          "You can request a copy of your data or ask us to delete it, in either language.",
        ],
      },
      {
        heading: "Contact",
        body: [`Questions about any of this? Email ${CONTACT_EMAIL}.`],
      },
    ] as Section[],
  },
  ar: {
    eyebrow: "المسار المهني · الخصوصية",
    title: "سيرتك الذاتية خاصة بك.",
    intro:
      "توضّح هذه الصفحة، بلغة واضحة، ما يحدث لسيرتك الذاتية وبياناتك المهنية عند استخدام أدوات المسار المهني لدى تركي. ما هو مكتوب هنا يعكس ما هو مطبَّق فعليًا اليوم، وليس وعدًا تسويقيًا — وأي جزء لم يُبنَ بعد، نذكره بوضوح.",
    updated: `آخر تحديث ${POLICY_VERSION}`,
    sections: [
      {
        heading: "سيرتك الذاتية خاصة بك",
        body: [
          "تحتوي السيرة الذاتية عادةً على اسمك، بريدك الإلكتروني، رقم جوالك، مدينتك، خبراتك العملية، تعليمك، روابطك، وتفاصيل أخرى تُعرّف بك. نتعامل مع كل ذلك كبيانات خاصة بك — لا كمحتوى تسويقي، ولا كمثال يُشارك مع أحد، ولا كشيء يمكن لأي شخص آخر تصفّحه.",
        ],
      },
      {
        heading: "ما هي المعلومات التي نعالجها",
        body: [
          "ملف السيرة الذاتية الذي ترفعه، والنص المستخرَج منه (الاسم، بيانات التواصل، الخبرات، التعليم، الروابط، وأي تفاصيل أخرى يحتويها).",
          "بريدك الإلكتروني المرتبط بحسابك، ونستخدمه لتسجيل دخولك والتواصل معك بخصوص تحليلك أو طلبك.",
          "إذا دفعت مقابل خدمة، مرجع الدفع الذي ترسله للتحقق (يُحفظ بشكل منفصل عن محتوى سيرتك الذاتية — انظر «المدفوعات» أدناه).",
        ],
      },
      {
        heading: "لماذا نعالج هذه المعلومات",
        body: [
          "لتنفيذ التحليل أو الخدمة التي طلبتها، وإصدار تقريرك، وتمكينك من الوصول إليه لاحقًا.",
          "للتحقق من عملية الدفع وإتاحة ما دفعت مقابله.",
          "للرد عليك إذا تواصلت معنا بخصوص حسابك أو طلبك.",
        ],
      },
      {
        heading: "كيف نستخدم الذكاء الاصطناعي",
        body: [
          "تحليل مدعوم بالذكاء الاصطناعي ومبني على منهجية واضحة لمراجعة السيرة والمسار المهني وضعها تركي بنفسه. الذكاء الاصطناعي لا يضع معايير التقييم من تلقاء نفسه — تأتي المعايير ومنطق التقييم من تلك المنهجية. تُرسَل سيرتك من خوادمنا إلى مزوّد الذكاء الاصطناعي فقط لأداء التحليل الذي طلبته، ولا تُرسل مباشرة من متصفحك أبدًا.",
        ],
      },
      {
        heading: "ما الذي لا نفعله",
        body: [
          "لا نضيف سيرتك، أو نتيجة تحليلها، أو مسوّدات إعادة الصياغة، تلقائيًا إلى بيانات تدريب، أو بيانات ضبط دقيق، أو أمثلة مشتركة، أو قاعدة معرفة للبحث، أو مجموعات بيانات تقييم.",
          "لا نعرض سيرتك أو نتيجة تحليلها أو بيانات التواصل الخاصة بك لعملاء آخرين.",
          "لا ننشئ رابطًا عامًا دائمًا لسيرتك الذاتية. لا يوجد رابط يمكن لأي شخص تصفّحه لرؤيتها.",
          "رفع السيرة، أو الدفع مقابل خدمة، أو إنشاء حساب، أو استخدام أداة الفحص، لا يُعدّ بحد ذاته موافقة على إعادة استخدام محتواك — انظر «التدريب وإعادة استخدام المعرفة» أدناه لمعرفة ما يُعدّ موافقة فعلية.",
        ],
      },
      {
        heading: "التخزين",
        body: [
          "يُخزَّن ملف سيرتك في مساحة تخزين خاصة. الملف غير عام، والوصول إليه مقيّد على مستوى قاعدة البيانات بحيث لا يستطيع قراءته أو حذفه سوى أنت — وأنت مسجّل دخول بحسابك. لا يستطيع أي حساب آخر، ولا حتى زائر مجهول، الوصول إليه، ومعرفة أو تخمين مسار الملف الداخلي لا يمنح أي وصول إليه.",
        ],
      },
      {
        heading: "مدة الاحتفاظ بالبيانات",
        body: [
          "تبقى سيرتك ونتيجة تحليلها محفوظة طالما حسابك نشط، أو إلى أن تطلب منّا حذفها. حذف سيرتك يزيل الملف المخزَّن فورًا. تُعلَّم سجلات قاعدة البيانات المرتبطة كمحذوفة فورًا ولا تُعرض عليك أو تُستخدم مجددًا، تمهيدًا لإزالتها النهائية المجدولة من أنظمتنا ونسخنا الاحتياطية.",
          "لن نَعِد بعدد ساعات أو أيام محدد للإزالة النهائية من النسخ الاحتياطية إلى أن تصبح هذه الجدولة مؤتمتة بالكامل من طرفها الآخر. ما هو صحيح اليوم فعليًا: الحذف الذي تطلبه يسري فورًا على الملف وعلى أي شيء يمكن لك أو لنا رؤيته أو استخدامه بعد ذلك.",
        ],
      },
      {
        heading: "التدريب وإعادة استخدام المعرفة",
        body: [
          "الافتراضي: لا إعادة استخدام إطلاقًا، لأي عميل. المحتوى الوحيد الذي يصبح يومًا جزءًا من قاعدة معرفة منهجية تركي المهنية هو: سير تركي الذاتية الخاصة، أو أمثلة يكتبها أو يوافق عليها تركي بنفسه، أو أمثلة اصطناعية (مُصطنعة)، أو محتوى عميل بموافقة صريحة ومنفصلة منك — بعد إخفاء هويته والموافقة عليه يدويًا. لا يُضاف أي شيء ترفعه تلقائيًا، بغض النظر عمّا دفعته أو وافقت عليه عند إنشاء الحساب.",
        ],
      },
      {
        heading: "المدفوعات",
        body: [
          "تُحفظ سجلات الدفع والتحقق من الشراء بشكل منفصل عن سيرتك ونتيجة تحليلها، لأسباب محاسبية وأسباب دعم ومنع احتيال — وهو نفس السبب الذي يجعل أي خدمة مدفوعة تحتفظ بسجل مالي حتى بعد حذف بيانات الحساب الأخرى. حذف بياناتك المهنية لا يحذف سجل مدفوعاتك.",
        ],
      },
      {
        heading: "الحذف",
        body: [
          "يمكنك أن تطلب منّا حذف سيرتك، أو كامل بياناتك المهنية، في أي وقت. نظام الحذف موجود فعليًا في خوادمنا اليوم؛ وزر الحذف الذاتي داخل المنتج قادم قريبًا. وإلى أن يُطلق، راسلنا (أدناه) وسنُنفّذ الطلب عبر النظام نفسه الذي سيستخدمه ذلك الزر.",
        ],
      },
      {
        heading: "خياراتك",
        body: [
          "أنت من يقرر ما إذا كان أي من محتواك سيُستخدم يومًا لتطوير منهجية تركي المهنية — وهو معطّل افتراضيًا، وإذا وافقت عليه يومًا فيمكنك سحب تلك الموافقة لاحقًا. سحب الموافقة يوقف أي استخدام مستقبلي لمحتوى لم يُخفَ ويُعتمد بعد؛ ولا يُلغي مثالًا مُعتمدًا ومُخفى الهوية لم يعد يدل عليك.",
          "يمكنك طلب نسخة من بياناتك أو طلب حذفها، بأي من اللغتين.",
        ],
      },
      {
        heading: "التواصل",
        body: [`لديك سؤال حول أي مما سبق؟ راسلنا على ${CONTACT_EMAIL}.`],
      },
    ] as Section[],
  },
};

export default function PrivacyClient() {
  const { lang, dir } = useLanguage();
  const t = COPY[lang];

  return (
    <div style={{ background: "var(--color-bg-primary)", minHeight: "100vh" }} dir={dir}>
      <TopBar />
      <Navbar />

      <main className="mx-auto max-w-[760px] px-6 pb-24 pt-32 sm:pt-40">
        <p
          className="text-xs font-medium uppercase tracking-[0.18em]"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {t.eyebrow}
        </p>
        <h1
          className="mt-3 text-[2rem] font-bold leading-tight sm:text-[2.6rem]"
          style={{ color: "var(--color-text-primary)" }}
        >
          {t.title}
        </h1>
        <p className="mt-5 text-[1.05rem] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {t.intro}
        </p>
        <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
          {t.updated}
        </p>

        <div className="mt-12 flex flex-col gap-10">
          {t.sections.map((section) => (
            <section key={section.heading}>
              <h2
                className="text-lg font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {section.heading}
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {section.body.map((paragraph, i) => (
                  <p
                    key={i}
                    className="text-[0.98rem] leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
