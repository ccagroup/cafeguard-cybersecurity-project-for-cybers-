import { useEffect, useState } from "react";

function webglSupported(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function constrainedDevice(): boolean {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  // The visitor asked the browser to save data, or the device has about 1 GB of memory.
  if (nav.connection?.saveData) return true;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 1) return true;
  return false;
}

/** True only when the 3D scene is safe and welcome: WebGL works, the device is not memory-constrained,
 *  and the visitor has not asked for reduced motion. */
export function useShow3D(): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setShow(!query.matches && webglSupported() && !constrainedDevice());
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return show;
}
