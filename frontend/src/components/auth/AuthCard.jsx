import { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";

/**
 * Glass auth card shell. Wraps the Login/Register form content on the
 * right-hand (60%) side of the split-screen layout.
 */
export default function AuthCard({ children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={[
        "w-full rounded-3xl border p-7 sm:p-9",
        "border-neutral-200 bg-white/90 shadow-xl shadow-neutral-900/5 backdrop-blur-xl",
        "dark:border-neutral-800 dark:bg-neutral-900/90 dark:shadow-black/20",
        className,
      ].join(" ")}
    >
      {children}
    </motion.div>
  );
}

/**
 * Shared styled text input for auth forms: leading icon, animated focus
 * ring, inline success/error state. Works with react-hook-form's
 * `register()` via forwardRef.
 *
 * @param {Object} props
 * @param {React.ElementType} props.icon - lucide icon component
 * @param {string} [props.error] - validation error message
 * @param {boolean} [props.success] - show a success (valid) state
 */
export const AuthField = forwardRef(function AuthField(
  { label, icon: Icon, error, success, id, className = "", ...inputProps },
  ref
) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
            aria-hidden="true"
          />
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={[
            "w-full rounded-xl border bg-white py-2.5 pr-3.5 text-sm text-neutral-900 outline-none transition-all duration-200",
            "placeholder:text-neutral-400",
            "dark:bg-neutral-800/60 dark:text-neutral-100 dark:placeholder:text-neutral-500",
            Icon ? "pl-10" : "pl-3.5",
            error
              ? "border-danger-500 focus:border-danger-500 focus:ring-4 focus:ring-danger-500/10"
              : success
                ? "border-brand-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                : "border-neutral-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-neutral-700",
          ].join(" ")}
          {...inputProps}
        />
        {success && !error && (
          <CheckCircle2
            className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500"
            aria-hidden="true"
          />
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 6 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-1.5 text-xs text-danger-500"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});
