import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

const items = ["Logged out of all accounts", "Browser data cleared", "No passwords saved"];

export function ChecklistDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const ticked = inView || !!reduce;

  return (
    <figure className="demo" ref={ref}>
      <div className="demo-panel">
        <p className="demo-title">End session on PC-02</p>
        <ul className="demo-list">
          {items.map((label, i) => (
            <li key={label} className="demo-row">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="18" height="18" rx="4" className="demo-box" />
                <motion.path
                  d="M5.5 10.5 8.5 13.5 14.5 6.5"
                  className="demo-tick"
                  initial={reduce ? false : { pathLength: 0 }}
                  animate={{ pathLength: ticked ? 1 : 0 }}
                  transition={{ duration: 0.35, delay: reduce ? 0 : 0.3 + i * 0.5 }}
                />
              </svg>
              {label}
            </li>
          ))}
        </ul>
        <span className="demo-button">End session</span>
      </div>
      <figcaption>Example of the end-of-session checklist. The session cannot close until all three are ticked.</figcaption>
    </figure>
  );
}
