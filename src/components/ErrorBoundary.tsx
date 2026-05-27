'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  readonly children: ReactNode
  readonly fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <main className="min-h-screen bg-bg-page p-8 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Algo salió mal
            </h2>
            <p className="text-sm text-text-muted mb-4">
              {this.state.error?.message ?? 'Error desconocido'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); globalThis.location.reload() }}
              className="text-sm text-primary hover:underline"
            >
              Reintentar
            </button>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}
