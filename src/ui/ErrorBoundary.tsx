import { Component, type ReactNode } from 'react'

type ErrorBoundaryState = { err?: unknown }

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { err: undefined }

  static getDerivedStateFromError(err: unknown) {
    return { err }
  }

  componentDidCatch(err: unknown) {
    console.error('App crash:', err)
  }

  render() {
    if (this.state.err) {
      const message = this.state.err instanceof Error ? this.state.err.message : String(this.state.err)
      return (
        <div style={{ padding: 16, color: '#ffb3b3', background: '#2b0000' }}>
          <strong>Something went wrong.</strong>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{message}</pre>
          <p>Open DevTools → Console for stack trace.</p>
        </div>
      )
    }
    return this.props.children
  }
}
