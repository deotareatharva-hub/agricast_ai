/**
 * @param {Object} props
 * @param {boolean} props.checked
 * @param {(checked: boolean) => void} props.onChange
 * @param {() => void} props.onForgotPassword
 */
export default function RememberMe({ checked, onChange, onForgotPassword, rememberLabel, forgotLabel }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <label className="flex cursor-pointer select-none items-center gap-2 text-neutral-600 dark:text-neutral-400">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-neutral-300 text-brand-600 accent-brand-600 focus:ring-2 focus:ring-brand-500/30 dark:border-neutral-600"
        />
        {rememberLabel}
      </label>
      <button
        type="button"
        onClick={onForgotPassword}
        className="font-medium text-brand-600 outline-none transition-colors hover:text-brand-700 focus-visible:underline dark:text-brand-400 dark:hover:text-brand-300"
      >
        {forgotLabel}
      </button>
    </div>
  );
}
