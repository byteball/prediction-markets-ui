import { lazy, Suspense, type ComponentType, type ReactNode } from "react";

// React.lazy + Suspense in one call; `load` returns the component itself, not a module.
export const lazyWithFallback = <P extends object>(load: () => Promise<ComponentType<P>>, fallback: (props: P) => ReactNode) => {
  const Lazy = lazy(() => load().then((Component) => ({ default: Component })));

  return (props: P) => <Suspense fallback={fallback(props)}>{<Lazy {...props} />}</Suspense>;
};
