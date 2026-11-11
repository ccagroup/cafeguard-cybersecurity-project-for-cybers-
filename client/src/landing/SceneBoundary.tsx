import { Component } from "react";
import type { ReactNode } from "react";

type Props = { fallback: ReactNode; children: ReactNode };

/** If the 3D scene fails for any reason, show the static picture instead of breaking the page. */
export class SceneBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("3D scene unavailable, showing the static shield.", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
