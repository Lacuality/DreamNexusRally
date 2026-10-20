import { Component, type ReactNode } from "react";

interface State {
  hasError: boolean;
}

// Shows a friendly screen instead of a blank page if something fails to load.
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Game crashed:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
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
      </div>
    );
  }
}
