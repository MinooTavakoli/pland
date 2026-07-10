import {
  Control,
  FieldPath,
  FieldValues,
  RegisterOptions,
} from "react-hook-form";
import { InputHTMLAttributes, ReactNode } from "react";

export type InputSize = "sm" | "md" | "lg";

export type InputVariant = "outline" | "filled" | "ghost";

export interface InputProps<T extends FieldValues> extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "name" | "prefix" | "suffix"
> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  hint?: string;
  rules?: RegisterOptions<T>;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  loading?: boolean;
  size?: InputSize;
  variant?: InputVariant;
  containerClassName?: string;
  inputClassName?: string;
}
