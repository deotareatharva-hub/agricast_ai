import { forwardRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Eye, EyeOff, Lock } from "lucide-react";

/**
 * Password field with a show/hide toggle. Works with react-hook-form's
 * `register()` via forwardRef.
 *
 * @param {Object} props
 * @param {string} [props.error]
 */
const PasswordInput = forwardRef(function PasswordInput(
  { label, error, id, className = "", ...inputProps },
  ref
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {label}
        </label>
      )}
      <div className="relative">
        <Lock
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
          aria-hidden="true"
        />
        <input
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={[
            "w-full rounded-xl border bg-white py-2.5 pl-10 pr-11 text-sm text-neutral-900 outline-none transition-all duration-200",
            "placeholder:text-neutral-400",
            "dark:bg-neutral-800/60 dark:text-neutral-100 dark:placeholder:text-neutral-500",
            error
              ? "border-danger-500 focus:border-danger-500 focus:ring-4 focus:ring-danger-500/10"
              : "border-neutral-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-neutral-700",
          ].join(" ")}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 outline-none transition-colors hover:text-neutral-600 focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:text-neutral-500 dark:hover:text-neutral-300"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
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

export default PasswordInput;
