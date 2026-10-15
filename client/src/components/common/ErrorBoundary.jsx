import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? (
      <main className="page-shell">
        <h1>Something went wrong</h1>
        <p>Please refresh the page to continue.</p>
      </main>
    ) : (
      this.props.children
    );
  }
}