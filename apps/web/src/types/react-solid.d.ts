// Type declarations for mixed React/SolidJS environment

declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// React component type declarations for .react.tsx files
declare module "*.react.tsx" {
  const component: React.ComponentType<any>;
  export default component;
}

// Extend global types for mixed environment
declare global {
  namespace JSX {
    interface Element {}
  }
}

export {};
