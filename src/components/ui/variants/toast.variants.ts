import { cva } from "class-variance-authority";

export const toastVariants = cva("", {
  variants: {
    variant: {
      default: "",
      destructive: "border-expense/30 bg-expense/5",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});
