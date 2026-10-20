import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Shown instead of the full-page error screen (used around optional 3D scenes). */
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

// Shows a friendly screen instead of a blank page if something fails to load,
// with the technical message underneath so a screenshot says what went wrong.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: unknown) {
    console.error("Game crashed:", error);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    const detail = `${error.name}: ${error.message}`.slice(0, 300);
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "16px",
          textAlign: "center",
          backgroundColor: "#0E1B24",
          color: "#FDC6B5",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <h1 style={{ color: "#24A0CE", fontSize: "28px", margin: 0 }}>Dream Nexus Rally</h1>
        <p style={{ margin: 0 }}>Something went wrong loading the game. / Algo salió mal al cargar el juego.</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "12px 24px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#24A0CE",
            color: "#fff",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Reload / Recargar
        </button>
        <code
          style={{
            maxWidth: "min(560px, 100%)",
            fontSize: "12px",
            lineHeight: 1.4,
            color: "#8fb2bf",
            wordBreak: "break-word",
            userSelect: "all",
          }}
        >
          {detail}
        </code>
      </div>
    );
  }
}
