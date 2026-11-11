import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function cssColor(name: string, fallback: string): THREE.Color {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(value || fallback);
}

function shieldShape(scale: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 1.25 * scale);
  s.lineTo(1.0 * scale, 0.9 * scale);
  s.lineTo(1.0 * scale, 0.1 * scale);
  s.bezierCurveTo(1.0 * scale, -0.6 * scale, 0.55 * scale, -0.98 * scale, 0, -1.3 * scale);
  s.bezierCurveTo(-0.55 * scale, -0.98 * scale, -1.0 * scale, -0.6 * scale, -1.0 * scale, 0.1 * scale);
  s.lineTo(-1.0 * scale, 0.9 * scale);
  s.lineTo(0, 1.25 * scale);
  return s;
}

function keyholeStem(): THREE.Shape {
  // Narrow at the top where it joins the circle, wider at the bottom, like a real keyhole.
  const s = new THREE.Shape();
  s.moveTo(-0.16, -0.42);
  s.lineTo(0.16, -0.42);
  s.lineTo(0.07, 0.22);
  s.lineTo(-0.07, 0.22);
  s.closePath();
  return s;
}

function Shield() {
  const group = useRef<THREE.Group>(null);

  const { outer, inner, outerGeo, innerGeo, stemGeo, colors } = useMemo(() => {
    const accent = cssColor("--accent", "#1e5b53");
    const hover = cssColor("--accent-hover", "#164640");
    const surface = cssColor("--surface", "#ffffff");

    const outerGeo = new THREE.ExtrudeGeometry(shieldShape(1), {
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 3,
      curveSegments: 28,
    });
    outerGeo.center();

    const innerGeo = new THREE.ExtrudeGeometry(shieldShape(0.78), {
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
      curveSegments: 28,
    });
    innerGeo.center();

    const stemGeo = new THREE.ShapeGeometry(keyholeStem());

    return {
      outer: hover,
      inner: accent,
      outerGeo,
      innerGeo,
      stemGeo,
      colors: { surface },
    };
  }, []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const targetY = Math.sin(t * 0.45) * 0.5 + state.pointer.x * 0.35;
    const targetX = Math.sin(t * 0.3) * 0.05 - state.pointer.y * 0.2;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetY, 3, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetX, 3, delta);
    g.position.y = Math.sin(t * 0.8) * 0.05;
  });

  return (
    <group ref={group}>
      <mesh geometry={outerGeo}>
        <meshStandardMaterial color={outer} roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh geometry={innerGeo} position={[0, 0, 0.23]}>
        <meshStandardMaterial color={inner} roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.25, 0.292]}>
        <circleGeometry args={[0.2, 40]} />
        <meshBasicMaterial color={colors.surface} toneMapped={false} />
      </mesh>
      <mesh geometry={stemGeo} position={[0, 0, 0.292]}>
        <meshBasicMaterial color={colors.surface} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function ShieldScene({ active }: { active: boolean }) {
  return (
    <Canvas
      aria-hidden="true"
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 5.4], fov: 34 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 4, 5]} intensity={1.7} />
      <directionalLight position={[-4, -2, 2]} intensity={0.4} />
      <Shield />
    </Canvas>
  );
}
