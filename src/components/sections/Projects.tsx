"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

type Bezier = [number, number, number, number];

const EASE: Bezier = [0.16, 1, 0.3, 1];

type ValueCardData = {
  title: string;
  image: string;
  alt: string;
  fit: "cover" | "contain";
  position?: string;
  className: string;
};

const VALUE_CARDS: ValueCardData[] = [
  {
    title: "Over 9+ years of experience",
    image: "/h1.jpg",
    alt: "Turki Almalki presenting to an audience",
    fit: "cover",
    position: "center 28%",
    className: "value-card-one",
  },
  {
    title: "Led fast-moving product teams",
    image: "/1.jpg",
    alt: "Turki Almalki leading a product presentation",
    fit: "cover",
    position: "center 20%",
    className: "value-card-three",
  },
  {
    title: "Solves problems through thoughtful design",
    image: "/design1.png",
    alt: "Digital product interface designs",
    fit: "contain",
    position: "center bottom",
    className: "value-card-four",
  },
  {
    title: "Turns ideas into meaningful milestones",
    image: "/screenshot.jpg",
    alt: "Turki Almalki presenting an innovation project",
    fit: "cover",
    position: "center 32%",
    className: "value-card-five",
  },
];

const TOOLS = [
  {
    name: "Figma",
    image: "/tools/figma.png",
  },
  {
    name: "React",
    image: "/tools/react.png",
  },
  {
    name: "Next.js",
    image: "/tools/framer.png",
  },
  {
    name: "Slack",
    image: "/tools/slack.png",
  },
  {
    name: "Node.js",
    image: "/tools/node-js.png",
  },
  {
    name: "TypeScript",
    image: "/tools/typescript.png",
  },
];

export default function Projects() {
  const sectionRef = useRef<HTMLElement>(null);

  const inView = useInView(sectionRef, {
    once: true,
    margin: "-80px",
  });

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="value-section"
    >
      <div className="value-container">
        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={
            inView
              ? {
                  opacity: 1,
                  y: 0,
                }
              : {
                  opacity: 0,
                  y: 12,
                }
          }
          transition={{
            duration: 0.6,
            ease: EASE,
          }}
          className="value-pill"
        >
          Value
        </motion.div>

        <motion.h2
          initial={{
            opacity: 0,
            y: 24,
          }}
          animate={
            inView
              ? {
                  opacity: 1,
                  y: 0,
                }
              : {
                  opacity: 0,
                  y: 24,
                }
          }
          transition={{
            duration: 0.8,
            ease: EASE,
            delay: 0.04,
          }}
          className="value-heading"
        >
          Why Work With Me?
        </motion.h2>

        <motion.p
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={
            inView
              ? {
                  opacity: 1,
                  y: 0,
                }
              : {
                  opacity: 0,
                  y: 18,
                }
          }
          transition={{
            duration: 0.7,
            ease: EASE,
            delay: 0.1,
          }}
          className="value-subheading"
        >
          Backed by experience, driven by purpose.
        </motion.p>

        <div className="value-grid">
          <ValueCard
            card={VALUE_CARDS[0]}
            index={0}
            inView={inView}
          />

          <ToolsCard
            index={1}
            inView={inView}
          />

          <ValueCard
            card={VALUE_CARDS[1]}
            index={2}
            inView={inView}
          />

          <ValueCard
            card={VALUE_CARDS[2]}
            index={3}
            inView={inView}
          />

          <ValueCard
            card={VALUE_CARDS[3]}
            index={4}
            inView={inView}
          />
        </div>
      </div>

      <style>{`
        .value-section {
          width: 100%;
          overflow: hidden;
          box-sizing: border-box;

          padding:
            clamp(84px, 9vw, 128px)
            clamp(20px, 3vw, 32px)
            clamp(110px, 12vw, 150px);

          background: var(--bg-primary, #ffffff);
          color: var(--text-primary, #090909);

          transition:
            background-color 350ms ease,
            color 350ms ease;
        }

        .value-container {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;

          text-align: center;
        }

        .value-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          min-height: 38px;
          padding: 7px 18px;

          margin-bottom: 26px;

          border-radius: 999px;

          background: var(--bg-pill, #f1f1f1);
          color: var(--text-secondary, #666666);

          font-size: 15px;
          font-weight: 500;
          line-height: 1;

          transition:
            background-color 350ms ease,
            color 350ms ease;
        }

        .value-heading {
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

        .value-subheading {
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

        /*
         * Six-column bento grid:
         * top cards span 2 columns each;
         * bottom cards span 3 columns each.
         */

        .value-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          grid-auto-rows: 360px;

          gap: 20px;

          width: 100%;
        }

        .value-card {
          position: relative;

          min-width: 0;
          height: 100%;

          display: flex;
          flex-direction: column;

          overflow: hidden;
          box-sizing: border-box;

          padding: 28px;

          text-align: left;

          background: var(--bg-card, #f3f3f3);

          border:
            1px solid
            var(
              --border-subtle,
              rgba(0, 0, 0, 0.03)
            );

          border-radius: 32px;

          transition:
            background-color 350ms ease,
            border-color 350ms ease,
            box-shadow 350ms ease;
        }

        .value-card-one,
        .value-tools-card,
        .value-card-three {
          grid-column: span 2;
        }

        .value-card-four,
        .value-card-five {
          grid-column: span 3;
        }

        .value-card:hover {
          box-shadow:
            var(
              --shadow-soft,
              0 16px 38px rgba(0, 0, 0, 0.07)
            );
        }

        .value-card-heading {
          position: relative;
          z-index: 2;

          flex: 0 0 auto;

          max-width: 100%;
          margin: 0 0 20px;

          color: var(--text-primary, #090909);

          font-size: clamp(27px, 2.1vw, 34px);
          font-weight: 800;
          line-height: 1.06;
          letter-spacing: -0.048em;

          text-wrap: balance;
          overflow-wrap: normal;
          word-break: normal;

          transition: color 350ms ease;
        }

        /*
         * Media always receives the remaining card height.
         * No fixed image height is needed.
         */

        .value-card-media {
          position: relative;

          flex: 1 1 auto;
          min-height: 0;
          width: 100%;

          overflow: hidden;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 22px;

          background:
            var(--bg-card-muted, #e8e8e8);

          transition: background-color 350ms ease;
        }

        .value-card-media-contain {
          padding: 18px 22px 0;
        }

        .value-card-image {
          object-fit: var(--value-image-fit);
          object-position: var(--value-image-position);

          transition:
            transform 450ms
              cubic-bezier(0.16, 1, 0.3, 1);
        }

        .value-card:hover .value-card-image {
          transform: scale(1.025);
        }

        /*
         * Tools card
         */

        .value-tools-card {
          justify-content: space-between;
        }

        .tools-cluster {
          flex: 1 1 auto;
          min-height: 0;
          width: 100%;

          display: grid;
          grid-template-columns: repeat(3, 58px);
          grid-auto-rows: 58px;

          align-content: center;
          justify-content: center;

          gap: 13px;

          margin-bottom: 20px;
        }

        .tool-icon {
          position: relative;

          width: 58px;
          height: 58px;

          display: flex;
          align-items: center;
          justify-content: center;

          overflow: hidden;

          border-radius: 50%;

          background: var(--bg-elevated, #ffffff);

          border:
            1px solid
            var(
              --border-subtle,
              rgba(0, 0, 0, 0.045)
            );

          box-shadow:
            var(
              --shadow-soft,
              0 10px 24px rgba(0, 0, 0, 0.08)
            );

          transition:
            transform 250ms ease,
            background-color 350ms ease,
            border-color 350ms ease;
        }

        .tool-icon:hover {
          transform: translateY(-3px);
        }

        .tool-icon-image {
          object-fit: contain;
        }

        .tools-card-heading {
          margin-bottom: 0;
        }

        /*
         * Dark mode
         */

        :global(.dark) .value-card,
        :global([data-theme="dark"]) .value-card {
          border-color: rgba(255, 255, 255, 0.06);
        }

        :global(.dark) .tool-icon,
        :global([data-theme="dark"]) .tool-icon {
          border-color: rgba(255, 255, 255, 0.07);
        }

        /*
         * Tablet:
         * two equal columns and consistent card heights.
         */

        @media (max-width: 980px) {
          .value-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-auto-rows: 380px;
          }

          .value-card-one,
          .value-tools-card,
          .value-card-three,
          .value-card-four {
            grid-column: span 1;
          }

          .value-card-five {
            grid-column: 1 / -1;
          }

          .value-card-heading {
            font-size: clamp(27px, 3.4vw, 34px);
          }
        }

        /*
         * Mobile:
         * every card becomes full width.
         */

        @media (max-width: 680px) {
          .value-section {
            padding:
              82px
              16px
              130px;
          }

          .value-container {
            max-width: 520px;
          }

          .value-pill {
            min-height: 36px;
            padding: 7px 17px;

            margin-bottom: 24px;

            font-size: 14px;
          }

          .value-heading {
            max-width: 360px;

            font-size: clamp(44px, 12vw, 58px);
            line-height: 1.02;
          }

          .value-subheading {
            max-width: 360px;

            margin:
              20px
              auto
              52px;

            font-size: clamp(20px, 6vw, 25px);
            line-height: 1.22;
          }

          .value-grid {
            grid-template-columns: 1fr;
            grid-auto-rows: auto;

            gap: 20px;
          }

          .value-card,
          .value-card-one,
          .value-tools-card,
          .value-card-three,
          .value-card-four,
          .value-card-five {
            grid-column: auto;

            width: 100%;
            height: 390px;
            min-height: 390px;

            padding: 24px;

            border-radius: 30px;
          }

          .value-card-heading {
            min-height: auto;

            margin-bottom: 18px;

            font-size: clamp(27px, 8vw, 34px);
            line-height: 1.08;
          }

          .value-card-media {
            border-radius: 20px;
          }

          .value-card-media-contain {
            padding: 14px 16px 0;
          }

          .tools-cluster {
            grid-template-columns: repeat(3, 56px);
            grid-auto-rows: 56px;

            gap: 12px;

            margin-bottom: 18px;
          }

          .tool-icon {
            width: 56px;
            height: 56px;
          }
        }

        /*
         * Very small phones
         */

        @media (max-width: 390px) {
          .value-section {
            padding-inline: 14px;
          }

          .value-heading {
            font-size: 42px;
          }

          .value-subheading {
            font-size: 20px;
          }

          .value-card {
            height: 370px;
            min-height: 370px;

            padding: 22px;
          }

          .value-card-heading {
            font-size: 28px;
          }

          .tools-cluster {
            grid-template-columns: repeat(3, 52px);
            grid-auto-rows: 52px;

            gap: 10px;
          }

          .tool-icon {
            width: 52px;
            height: 52px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .value-card,
          .value-card-image,
          .tool-icon {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}

type ValueCardProps = {
  card: ValueCardData;
  index: number;
  inView: boolean;
};

function ValueCard({
  card,
  index,
  inView,
}: ValueCardProps) {
  return (
    <motion.article
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
        delay: 0.12 + index * 0.07,
      }}
      whileHover={{
        y: -5,
        transition: {
          duration: 0.3,
          ease: EASE,
        },
      }}
      className={`value-card ${card.className}`}
    >
      <h3 className="value-card-heading">
        {card.title}
      </h3>

      <div
        className={[
          "value-card-media",
          card.fit === "contain"
            ? "value-card-media-contain"
            : "",
        ].join(" ")}
      >
        <Image
          src={card.image}
          alt={card.alt}
          fill
          sizes="
            (max-width: 680px) calc(100vw - 80px),
            (max-width: 980px) 44vw,
            390px
          "
          className="value-card-image"
          style={
            {
              "--value-image-fit": card.fit,
              "--value-image-position":
                card.position ?? "center center",
            } as React.CSSProperties
          }
        />
      </div>
    </motion.article>
  );
}

type ToolsCardProps = {
  index: number;
  inView: boolean;
};

function ToolsCard({
  index,
  inView,
}: ToolsCardProps) {
  return (
    <motion.article
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
        delay: 0.12 + index * 0.07,
      }}
      whileHover={{
        y: -5,
        transition: {
          duration: 0.3,
          ease: EASE,
        },
      }}
      className="value-card value-tools-card"
    >
      <div className="tools-cluster">
        {TOOLS.map((tool) => (
          <div
            key={tool.name}
            className="tool-icon"
            title={tool.name}
          >
            <Image
              src={tool.image}
              alt={`${tool.name} logo`}
              width={36}
              height={36}
              className="tool-icon-image"
            />
          </div>
        ))}
      </div>

      <h3 className="value-card-heading tools-card-heading">
        Skilled in modern engineering and design tools
      </h3>
    </motion.article>
  );
}