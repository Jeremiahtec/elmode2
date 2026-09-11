// components/vehicle3d/ModelErrorBoundary.tsx
"use client";

import { Component, type ReactNode } from "react";

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * React error boundaries have no hook equivalent (as of React 18) — a class
 * component is required. This exists solely to catch GLTF load/parse
 * failures inside the 3D scene and swap to the procedural fallback,
 * per brief #25 ("must not crash the dashboard").
 */
export class ModelErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[ModelErrorBoundary] 3D vehicle model failed to load, using procedural fallback:", error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
