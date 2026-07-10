"use client";

import clsx from "clsx";
import { Controller, FieldValues } from "react-hook-form";

import { InputProps } from "./input.type";

const sizeClasses = {
  sm: "h-10 text-sm px-3",
  md: "h-12 text-base px-4",
  lg: "h-14 text-lg px-5",
};

const variantClasses = {
  outline: "border border-gray-300 bg-white",
  filled: "bg-gray-100 border border-transparent",
  ghost: "border-b border-gray-300 rounded-none",
};

export default function Input<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  rules,
  leftIcon,
  rightIcon,
  prefix,
  suffix,
  loading,
  size = "md",
  variant = "outline",
  containerClassName,
  inputClassName,
  disabled,
  ...props
}: InputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <div className={clsx("w-full", containerClassName)}>
          {label && (
            <label className="mb-2 block text-sm font-medium">{label}</label>
          )}

          <div
            className={clsx(
              "flex items-center rounded-xl transition",
              sizeClasses[size],
              variantClasses[variant],
              fieldState.error ? "border-red-500" : "",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            {prefix && <div className="px-3 text-gray-500">{prefix}</div>}
            {leftIcon && <div className="px-3">{leftIcon}</div>}
            <input
              {...field}
              {...props}
              disabled={disabled}
              className={clsx(
                "h-full flex-1 bg-transparent outline-none",
                inputClassName,
              )}
            />
            {loading && (
              <div className="px-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
              </div>
            )}
            {rightIcon && !loading && <div className="px-3">{rightIcon}</div>}
            {suffix && <div className="px-3 text-gray-500">{suffix}</div>}
          </div>

          {fieldState.error && (
            <p className="mt-2 text-xs text-red-500">
              {fieldState.error.message}
            </p>
          )}

          {!fieldState.error && hint && (
            <p className="mt-2 text-xs text-gray-500">{hint}</p>
          )}
        </div>
      )}
    />
  );
}
