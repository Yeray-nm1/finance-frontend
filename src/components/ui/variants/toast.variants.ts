import { cva } from "class-variance-authority";

export const toastVariants = cva("border-transparent", {
  variants: {
    variant: {
      default: "bg-income text-white",
      destructive: "bg-expense text-white",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});
