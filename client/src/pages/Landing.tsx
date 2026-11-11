import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MotionConfig, motion } from "framer-motion";
import { Ban, Bell, Check, KeyRound, ScrollText, ShieldAlert } from "lucide-react";
import { Logo } from "../components/Logo";
import { ChecklistDemo } from "../landing/ChecklistDemo";
import { HeroVisual } from "../landing/HeroVisual";
import { Reveal } from "../landing/Reveal";
import { usePageTitle } from "../lib/usePageTitle";

const DESCRIPTION =
  "CaféGuard gives cyber cafés an end-of-session checklist, alerts for activity on empty stations, and an audit trail nobody can quietly edit.";

function useLandingMeta() {
  usePageTitle("Stop account intrusion on shared computers");

  useEffect(() => {
    const meta = document.querySelector('meta[name="description"]');
    const previous = meta?.getAttribute("content") ?? null;
    meta?.setAttribute("content", DESCRIPTION);

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "CaféGuard",
      applicationCategory: "SecurityApplication",
      operatingSystem: "Web",
      description: DESCRIPTION,
      audience: { "@type": "Audience", audienceType: "Cyber café owners and attendants" },
    });
    document.head.appendChild(script);

    return () => {
      script.remove();
      if (previous !== null) meta?.setAttribute("content", previous);
    };
  }, []);
}

const steps = [
  {
    title: "Start a session",
    text: "The attendant enters the customer's name and the station is marked in use. One open session per station, enforced by the system.",
  },
  {
    title: "End it with the checklist",
    text: "Logged out, browser data cleared, no passwords saved. The session only closes when all three are confirmed.",
  },
  {
    title: "Investigate with evidence",
    text: "When something goes wrong, the incident page shows who did what on that station in the hours around it.",
  },
];

const features = [
  {
    icon: Bell,
    title: "Alerts for empty stations",
    text: "Activity on a station with no open session, or a finished session being reopened, raises an alert that staff acknowledge.",
  },
  {
    icon: ShieldAlert,
    title: "Incident reports and timeline",
    text: "Log what a customer reported, track its status and notes, and see sessions and staff actions merged into one timeline.",
  },
  {
    icon: ScrollText,
    title: "An audit trail that only grows",
    text: "Every sign-in, session, alert and change is recorded with who and when. Nothing in the app can edit or delete an entry.",
  },
  {
    icon: KeyRound,
    title: "Controlled staff access",
    text: "The owner adds and removes attendants. Sign-in has rate limiting and account lockout, and removed staff are cut off at once.",
  },
];

export function Landing() {
  useLandingMeta();

  return (
    <MotionConfig reducedMotion="user">
      <div className="lp">
        <a className="skip-link" href="#main">
          Skip to content
        </a>

        <div className="lp-container">
          <header className="lp-header">
            <span className="brand">
              <Logo />
              CaféGuard
            </span>
            <nav className="lp-nav" aria-label="Page sections">
              <a className="link" href="#how">
                How it works
              </a>
              <a className="link" href="#privacy">
                Privacy
              </a>
              <a className="link" href="#features">
                Features
              </a>
              <Link className="btn btn-secondary" to="/login">
                Sign in
              </Link>
            </nav>
          </header>
        </div>

        <main id="main">
          <section className="lp-container hero" aria-labelledby="hero-title">
            <div className="hero-copy">
              <motion.h1
                id="hero-title"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                When a customer leaves, their accounts should leave with them.
              </motion.h1>
              <motion.p
                className="lp-lede"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
              >
                CaféGuard gives cyber cafés an end-of-session checklist, alerts for activity on empty
                computers, and a record that nobody can quietly edit.
              </motion.p>
              <motion.div
                className="hero-actions"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              >
                <Link className="btn btn-primary" to="/login">
                  Sign in
                </Link>
                <a className="btn btn-secondary" href="#how">
                  See how it works
                </a>
              </motion.div>
            </div>
            <HeroVisual />
          </section>

          <section id="how" className="lp-section" aria-labelledby="how-title">
            <div className="lp-container">
              <Reveal>
                <h2 id="how-title">How it works</h2>
                <p className="lp-lede">
                  Three habits that close the gap where account intrusion usually happens: the moment
                  a customer walks away.
                </p>
              </Reveal>
              <ol className="steps">
                {steps.map((s, i) => (
                  <li key={s.title}>
                    <Reveal delay={i * 0.08}>
                      <span className="step-no" aria-hidden="true">
                        0{i + 1}
                      </span>
                      <h3>{s.title}</h3>
                      <p>{s.text}</p>
                    </Reveal>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="lp-section" aria-labelledby="check-title">
            <div className="lp-container split">
              <Reveal>
                <h2 id="check-title">The checklist is a gate, not a suggestion</h2>
                <p className="lp-lede">
                  The server refuses to close a session unless all three items are confirmed. The
                  owner can still force-close one, but it is recorded as not ended properly and
                  counted on the dashboard.
                </p>
              </Reveal>
              <Reveal delay={0.1}>
                <ChecklistDemo />
              </Reveal>
            </div>
          </section>

          <section id="privacy" className="lp-section" aria-labelledby="privacy-title">
            <div className="lp-container">
              <Reveal>
                <h2 id="privacy-title">It protects customers without watching them</h2>
                <p className="lp-lede">
                  CaféGuard keeps a record of the café's own activity. It has no way to see what a
                  customer types or opens.
                </p>
              </Reveal>
              <div className="two-col">
                <Reveal>
                  <h3 className="list-head">CaféGuard records</h3>
                  <ul className="mark-list">
                    {[
                      "Session start and end times",
                      "Which station and which attendant",
                      "Staff sign-ins and actions",
                      "Incident reports and investigation notes",
                    ].map((t) => (
                      <li key={t}>
                        <Check size={18} aria-hidden="true" className="icon-yes" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </Reveal>
                <Reveal delay={0.08}>
                  <h3 className="list-head">CaféGuard never records</h3>
                  <ul className="mark-list">
                    {[
                      "Customer passwords or any third-party login",
                      "Keystrokes",
                      "Screen captures",
                      "Browsing history",
                    ].map((t) => (
                      <li key={t}>
                        <Ban size={18} aria-hidden="true" className="icon-no" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>
            </div>
          </section>

          <section id="features" className="lp-section" aria-labelledby="features-title">
            <div className="lp-container">
              <Reveal>
                <h2 id="features-title">What the owner gets</h2>
              </Reveal>
              <ul className="features">
                {features.map(({ icon: Icon, title, text }, i) => (
                  <li key={title}>
                    <Reveal delay={(i % 2) * 0.08}>
                      <Icon size={22} aria-hidden="true" className="feature-icon" />
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="lp-section closing" aria-labelledby="closing-title">
            <div className="lp-container closing-inner">
              <Reveal>
                <h2 id="closing-title">Staff sign in with the account the owner created</h2>
                <p className="lp-lede">There is no public sign-up. Ask the café owner for access.</p>
              </Reveal>
              <Link className="btn btn-primary" to="/login">
                Sign in
              </Link>
            </div>
          </section>
        </main>

        <footer className="lp-footer">
          <div className="lp-container lp-footer-inner">
            <span className="brand">
              <Logo size={22} />
              CaféGuard
            </span>
            <span className="muted">Protecting customer accounts on shared computers.</span>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
