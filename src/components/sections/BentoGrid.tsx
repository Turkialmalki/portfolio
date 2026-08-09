"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";

type Bezier = [number, number, number, number];

const EASE: Bezier = [0.16, 1, 0.3, 1];

type EssenceCard = {
  icon: string;
  title: string;
  text: string;
};

const COPY = {
  en: {
    pill: "Essence",
    title: "Behind the Screens",
    subtitle: "A glimpse into my mindset, style, and engineering edge.",
    cards: [
      {
        icon: "🤔",
        title: "Who am I?",
        text: "Build scalable, high-impact web and mobile experiences",
      },
      {
        icon: "🧠",
        title: "My Philosophy",
        text: "Bridge the gap between design and development through clear collaboration",
      },
      {
        icon: "✨",
        title: "My Distinct Edge",
        text: "Design technology around real user and business needs",
      },
    ] as EssenceCard[],
  },
  ar: {
    pill: "الجوهر",
    title: "خلف الشاشات",
    subtitle: "لمحة عن طريقة تفكيري وأسلوبي وميزتي الهندسية.",
    cards: [
      {
        icon: "🤔",
        title: "من أنا؟",
        text: "أبني تجارب ويب وجوال قابلة للتوسع وعالية الأثر",
      },
      {
        icon: "🧠",
        title: "فلسفتي",
        text: "أردم الفجوة بين التصميم والتطوير عبر تعاون واضح",
      },
      {
        icon: "✨",
        title: "ميزتي المختلفة",
        text: "أصمم التقنية حول احتياجات المستخدم والأعمال الحقيقية",
      },
    ] as EssenceCard[],
  },
};

export default function BentoGrid() {
  const sectionRef = useRef<HTMLElement>(null);
  const { lang } = useLanguage();
  const copy = COPY[lang];

  const inView = useInView(sectionRef, {
    once: true,
    margin: "-80px",
  });

  return (
    <section
      id="about"
      ref={sectionRef}
      className="essence-section"
    >
      <div className="essence-container">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={
            inView
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 12 }
          }
          transition={{
            duration: 0.6,
            ease: EASE,
          }}
          className="essence-pill"
        >
          {copy.pill}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          animate={
            inView
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 22 }
          }
          transition={{
            duration: 0.8,
            ease: EASE,
            delay: 0.05,
          }}
          className="essence-title"
        >
          {copy.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={
            inView
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 18 }
          }
          transition={{
            duration: 0.75,
            ease: EASE,
            delay: 0.1,
          }}
          className="essence-subtitle"
        >
          {copy.subtitle}
        </motion.p>

        <div className="essence-grid">
          {copy.cards.map((card, index) => (
            <motion.article
              key={card.title}
              initial={{
                opacity: 0,
                y: 30,
              }}
              animate={
                inView
                  ? {
                      opacity: 1,
                      y: 0,
                    }
                  : {
                      opacity: 0,
                      y: 30,
                    }
              }
              transition={{
                duration: 0.75,
                ease: EASE,
                delay: 0.12 + index * 0.08,
              }}
              whileHover={{
                y: -5,
                transition: {
                  duration: 0.3,
                  ease: EASE,
                },
              }}
              className="essence-card"
            >
              <div
                className="essence-card-icon"
                aria-hidden="true"
              >
                {card.icon}
              </div>

              <h3 className="essence-card-title">
                {card.title}
              </h3>

              <p className="essence-card-text">
                {card.text}
              </p>
            </motion.article>
          ))}
        </div>
      </div>

      <style>{`
        .essence-section {
          width: 100%;
          overflow: hidden;

          background: var(--bg-primary, #ffffff);
          color: var(--text-primary, #090909);

          padding:
            clamp(84px, 9vw, 128px)
            clamp(20px, 3vw, 32px)
            clamp(110px, 12vw, 150px);

          box-sizing: border-box;

          transition:
            background-color 350ms ease,
            color 350ms ease;
        }

        .essence-container {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;

          text-align: center;
        }

        .essence-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          min-height: 38px;
          padding: 7px 18px;

          background: var(--bg-pill, #f1f1f1);
          color: var(--text-secondary, #666666);

          border-radius: 999px;

          font-size: 15px;
          font-weight: 500;
          line-height: 1;

          margin-bottom: 26px;

          transition:
            background-color 350ms ease,
            color 350ms ease;
        }

        .essence-title {
          max-width: 900px;
          margin: 0 auto;

          color: var(--text-primary, #090909);

          font-size: clamp(46px, 5.2vw, 72px);
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.055em;

          text-wrap: balance;

          transition: color 350ms ease;
        }

        .essence-subtitle {
          max-width: 660px;

          margin:
            clamp(18px, 2vw, 24px)
            auto
            clamp(54px, 6vw, 74px);

          color: var(--text-secondary, #666666);

          font-size: clamp(20px, 2vw, 28px);
          font-weight: 600;
          line-height: 1.2;
          letter-spacing: -0.025em;

          text-wrap: balance;

          transition: color 350ms ease;
        }

        .essence-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));

          gap: clamp(20px, 2.2vw, 28px);

          width: 100%;
        }

        .essence-card {
          min-width: 0;
          min-height: 320px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          padding:
            clamp(44px, 4.5vw, 58px)
            clamp(28px, 3vw, 38px);

          box-sizing: border-box;

          background: var(--bg-card, #f3f3f3);

          border:
            1px solid
            var(
              --border-subtle,
              rgba(0, 0, 0, 0.03)
            );

          border-radius: clamp(26px, 2.2vw, 34px);

          transition:
            background-color 350ms ease,
            border-color 350ms ease,
            box-shadow 350ms ease;
        }

        .essence-card:hover {
          box-shadow:
            var(
              --shadow-soft,
              0 16px 38px rgba(0, 0, 0, 0.07)
            );
        }

        .essence-card-icon {
          display: flex;
          align-items: center;
          justify-content: center;

          min-height: 68px;

          margin-bottom: 24px;

          font-size: clamp(50px, 4.5vw, 62px);
          line-height: 1;
        }

        .essence-card-title {
          max-width: 100%;

          margin: 0 0 16px;

          color: var(--text-primary, #090909);

          font-size: clamp(28px, 2.5vw, 38px);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -0.045em;

          text-wrap: balance;
          overflow-wrap: normal;
          word-break: normal;

          transition: color 350ms ease;
        }

        .essence-card-text {
          width: 100%;
          max-width: 310px;

          margin: 0;

          color: var(--text-secondary, #666666);

          font-size: clamp(16px, 1.35vw, 18px);
          font-weight: 400;
          line-height: 1.5;
          letter-spacing: -0.018em;

          text-wrap: pretty;
          overflow-wrap: normal;
          word-break: normal;

          transition: color 350ms ease;
        }

        /*
         * Tablet: two columns.
         */

        @media (max-width: 900px) {
          .essence-section {
            padding-inline: 24px;
          }

          .essence-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .essence-card:last-child {
            grid-column: 1 / -1;

            width: min(100%, calc(50% - 10px));
            justify-self: center;
          }
        }

        /*
         * Mobile: one full-width card per row.
         */

        @media (max-width: 640px) {
          .essence-section {
            padding:
              82px
              16px
              130px;
          }

          .essence-container {
            max-width: 520px;
          }

          .essence-pill {
            min-height: 36px;

            padding: 7px 17px;

            margin-bottom: 24px;

            font-size: 14px;
          }

          .essence-title {
            max-width: 350px;

            font-size: clamp(44px, 12vw, 58px);
            line-height: 1.02;
            letter-spacing: -0.052em;
          }

          .essence-subtitle {
            max-width: 360px;

            margin:
              20px
              auto
              52px;

            font-size: clamp(20px, 6vw, 25px);
            line-height: 1.22;
          }

          .essence-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .essence-card,
          .essence-card:last-child {
            grid-column: auto;

            width: 100%;
            min-height: 0;

            padding:
              48px
              26px
              50px;

            border-radius: 30px;
          }

          .essence-card-icon {
            min-height: 62px;

            margin-bottom: 24px;

            font-size: 54px;
          }

          .essence-card-title {
            max-width: 100%;

            margin-bottom: 16px;

            font-size: clamp(30px, 9vw, 38px);
            line-height: 1.08;
          }

          .essence-card-text {
            max-width: 350px;

            font-size: 17px;
            line-height: 1.5;
          }
        }

        /*
         * Very small phones.
         */

        @media (max-width: 390px) {
          .essence-section {
            padding-inline: 14px;
          }

          .essence-title {
            font-size: 42px;
          }

          .essence-subtitle {
            font-size: 20px;
          }

          .essence-card {
            padding:
              42px
              22px
              44px;
          }

          .essence-card-title {
            font-size: 30px;
          }

          .essence-card-text {
            font-size: 16px;
          }
        }

        /*
         * Dark theme support.
         */

        :global(.dark) .essence-card,
        :global([data-theme="dark"]) .essence-card {
          border-color: rgba(255, 255, 255, 0.06);
        }

        @media (prefers-reduced-motion: reduce) {
          .essence-card {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}