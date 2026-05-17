"use client";

import { useState, useEffect } from "react";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Portfolio", href: "#projects" },
  { label: "About", href: "#about" },
  { label: "Blog", href: "#blog" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    if (href === "#home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: scrolled ? "1px solid #E4E7EC" : "1px solid transparent",
        transition: "border-color 0.3s ease",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 72,
        }}
      >
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            fontWeight: 700,
            fontSize: 18,
            color: "#0D0E12",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: "-0.01em",
          }}
        >
          Turki Al-Malki
        </button>

        {/* Desktop Nav */}
        <div
          className="hidden md:flex"
          style={{ alignItems: "center", gap: 32 }}
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              label={link.label}
              onClick={() => handleNavClick(link.href)}
            />
          ))}
          <a
            href="mailto:turkialmalki202200@gmail.com"
            style={{
              background: "#0D0E12",
              color: "#FFFFFF",
              padding: "10px 22px",
              borderRadius: 100,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: "inherit",
              letterSpacing: "-0.01em",
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.opacity = "0.85")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.opacity = "1")
            }
          >
            Connect
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            gap: 5,
            padding: 4,
          }}
        >
          <span
            style={{
              display: "block",
              width: 22,
              height: 2,
              background: "#0D0E12",
              borderRadius: 2,
              transformOrigin: "center",
              transform: menuOpen ? "translateY(7px) rotate(45deg)" : "none",
              transition: "transform 0.25s ease",
            }}
          />
          <span
            style={{
              display: "block",
              width: 22,
              height: 2,
              background: "#0D0E12",
              borderRadius: 2,
              opacity: menuOpen ? 0 : 1,
              transition: "opacity 0.2s ease",
            }}
          />
          <span
            style={{
              display: "block",
              width: 22,
              height: 2,
              background: "#0D0E12",
              borderRadius: 2,
              transformOrigin: "center",
              transform: menuOpen ? "translateY(-7px) rotate(-45deg)" : "none",
              transition: "transform 0.25s ease",
            }}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className="md:hidden"
        style={{
          overflow: "hidden",
          maxHeight: menuOpen ? 320 : 0,
          transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)",
          borderTop: menuOpen ? "1px solid #E4E7EC" : "1px solid transparent",
          backgroundColor: "#FFFFFF",
        }}
      >
        <div
          style={{
            padding: "16px 24px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNavClick(link.href)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: 16,
                color: "#666D80",
                fontFamily: "inherit",
                textAlign: "left",
                padding: "10px 0",
              }}
            >
              {link.label}
            </button>
          ))}
          <a
            href="mailto:turkialmalki202200@gmail.com"
            style={{
              display: "inline-block",
              marginTop: 8,
              background: "#0D0E12",
              color: "#FFFFFF",
              padding: "12px 22px",
              borderRadius: 100,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: "inherit",
              textAlign: "center",
            }}
          >
            Connect
          </a>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontWeight: 500,
        fontSize: 14,
        color: hovered ? "#0D0E12" : "#666D80",
        fontFamily: "inherit",
        transition: "color 0.2s ease",
        letterSpacing: "-0.01em",
      }}
    >
      {label}
    </button>
  );
}
