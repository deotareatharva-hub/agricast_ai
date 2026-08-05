import { Component } from "react";
import Button from "./ui/Button";

// The original context doc lists "Error Boundary" under Providers, but no
// such component existed anywhere in the codebase - a render error in any
// page would have taken down the whole app to a blank white screen. This
// wraps <App /> in main.jsx.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Unhandled render error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">Something went wrong</h1>
        <p className="max-w-sm text-sm text-neutral-500">
          An unexpected error occurred. You can go back to the home page and try again.
        </p>
        <Button onClick={this.handleReset}>Back to home</Button>
      </div>
    );
  }
}
