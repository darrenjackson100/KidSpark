import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export default class GameErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Game crashed:", error);
  }

  private handleBack = () => {
    this.setState({ hasError: false });
    window.location.href = import.meta.env.BASE_URL;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-card rounded-[3rem] p-12 text-center shadow-2xl border-4 border-card-border">
            <div className="text-8xl mb-6">🛠️</div>
            <h1 className="text-4xl font-black text-foreground mb-8">
              Oops, this game needs fixing.
            </h1>
            <button
              onClick={this.handleBack}
              className="h-16 px-12 rounded-full text-2xl font-black bg-primary hover:bg-primary/90 text-white shadow-xl"
              data-testid="button-error-back"
            >
              ← Back
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
