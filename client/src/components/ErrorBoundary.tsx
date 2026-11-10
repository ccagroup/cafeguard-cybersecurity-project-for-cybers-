import { Component } from "react";
import type { ReactNode } from "react";

type State = { failed: boolean };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="auth-page">
          <div className="auth-card" role="alert">
            <h1>Something went wrong</h1>
            <p className="lede">The page hit an unexpected problem. Your data is safe.</p>
            <button className="btn btn-primary" onClick={() => window.location.assign("/")}>
              Back to the start
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
