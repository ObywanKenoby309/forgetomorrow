// components/ui/Buttons.js
import React from "react";
import Link from "next/link";

const base =
  "inline-flex items-center justify-center rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
const sizes = {
  sm: "text-sm px-3 py-2",
  md: "text-sm px-4 py-2", // default
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

/** Brand orange primary */
export function PrimaryButton({
  children,
  href,
  size = "md",
  fullWidth = false,
  className,
  disabled = false,
  type = "button",
  onClick,
  ...rest
}) {
  const styles = cx(
    base,
    sizes[size],
    "text-white bg-[#FF7043] hover:bg-[#F4511E] focus:ring-[#FF7043]",
    disabled && "opacity-60 cursor-not-allowed hover:bg-[#FF7043]",
    fullWidth && "w-full",
    className
  );

  if (href) {
    // Render as Next.js Link (no manual <a> usage in your pages)
    return (
      <Link href={href} className={styles} aria-disabled={disabled} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={styles}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Subtle outlined secondary */
export function SecondaryButton({
  children,
  href,
  size = "md",
  fullWidth = false,
  className,
  disabled = false,
  type = "button",
  onClick,
  ...rest
}) {
  const styles = cx(
    base,
    sizes[size],
    "border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-300 bg-white",
    disabled && "opacity-60 cursor-not-allowed hover:bg-white",
    fullWidth && "w-full",
    className
  );

  if (href) {
    return (
      <Link href={href} className={styles} aria-disabled={disabled} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={styles}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
