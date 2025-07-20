// @ts-nocheck
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import React from "react";

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 white",
  {
    variants: {
      variant: {
        default: "bg-zinc-950 hover:bg-zinc-950/90 text-white",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        warning:
          "bg-gradient-to-r from-orange-500 to-yellow-500 hover:bg-gradient-to-bl text-white",
        outline:
          "border border-input bg-background hover:bg-gray-50 hover:text-accent-foreground",
        secondary:
          "bg-gradient-to-r from-green-500 to-emerald-500 hover:bg-gradient-to-bl text-white",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "bg-blue-100 text-blue-500 underline-offset-4 hover:underline",
        trigger: "hover:bg-gray-100 text-gray-900",
      },
      size: {
        default: "h-10 px-4 py-2",
        xl: "h-7 rounded-md px-3",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef<any, any>((props, ref) => {
  const { className, variant, size, children, ...otherProps } = props;

  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...otherProps}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
