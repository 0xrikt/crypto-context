"use client";
import { cloneElement, isValidElement, useId, type ReactNode } from "react";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label?: string;
  hint?: ReactNode;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  const generatedId = useId();
  const child = isValidElement<{id?:string; "aria-describedby"?:string; "aria-invalid"?:boolean}>(children) ? children : null;
  const id = htmlFor ?? child?.props.id ?? generatedId;
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm text-gray-500 mb-1.5">
          {label}
          {hint && <span className="text-gray-300"> {hint}</span>}
        </label>
      )}
      {child ? cloneElement(child, {id, "aria-describedby": error ? `${id}-error` : child.props["aria-describedby"], "aria-invalid": !!error}) : children}
      {error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
