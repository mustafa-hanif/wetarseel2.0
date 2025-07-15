// src/types.d.ts

import "solid-js"; // Import solid-js to ensure JSX types are available

// Vite environment variables
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Add other VITE_ prefixed environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      // Add your custom directives here
      // The key is the directive name (e.g., 'formSubmit' for use:formSubmit)
      // The value is the type of the argument that the directive expects
      formSubmit?: (form: HTMLFormElement) => Promise<void> | void;
    }
    // If your directive can be applied to specific elements, you might also extend
    // the IntrinsicElements for those specific elements, but Directives is often enough
    // when the directive's purpose is generic.
    // For a form directive, you might also do:
    // interface IntrinsicElements {
    //   form: FormHTMLAttributes<HTMLFormElement> & {
    //     "use:formSubmit"?: (form: HTMLFormElement) => Promise<void> | void;
    //   };
    // }
  }
}
