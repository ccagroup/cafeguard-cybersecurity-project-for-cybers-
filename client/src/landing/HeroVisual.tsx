import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { SceneBoundary } from "./SceneBoundary";
import { StaticShield } from "./StaticShield";
import { useShow3D } from "./useShow3D";

// Loaded only when needed, so the 3D library never slows down the rest of the app.
const ShieldScene = lazy(() => import("./ShieldScene"));

export function HeroVisual() {
  const show3D = useShow3D();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  // Pause rendering while the shield is off-screen to save battery.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fallback = <StaticShield />;

  return (
    <div
      ref={ref}
      className="hero-visual"
      role="img"
      aria-label="A green shield with a keyhole in the middle, turning slowly."
    >
      {show3D ? (
        <SceneBoundary fallback={fallback}>
          <Suspense fallback={fallback}>
            <ShieldScene active={visible} />
          </Suspense>
        </SceneBoundary>
      ) : (
        fallback
      )}
    </div>
  );
}
