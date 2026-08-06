import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { AlertCircle, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AuthField, PasswordInput, RememberMe } from "../components/auth";
import GoogleLoginButton from "../features/auth/components/GoogleLoginButton";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: "", password: "" } });

  const onSubmit = async (values) => {
    setServerError("");
    try {
      await login(values);
      toast.success(t("auth.loginSuccess"));
      const redirectTo = location.state?.from?.pathname || "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
        {t("auth.loginTitle")}
      </h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t("auth.loginSubtitle")}</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-danger-500/20 bg-danger-500/5 px-3 py-2.5 text-sm text-danger-500"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {serverError}
          </motion.div>
        )}

        <AuthField
          id="email"
          type="email"
          autoComplete="email"
          icon={Mail}
          label={t("auth.email")}
          error={errors.email?.message}
          {...register("email", {
            required: t("validation.required"),
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: t("validation.invalidEmail"),
            },
          })}
        />

        <PasswordInput
          id="password"
          autoComplete="current-password"
          label={t("auth.password")}
          error={errors.password?.message}
          {...register("password", { required: t("validation.required") })}
        />

        <RememberMe
          checked={rememberMe}
          onChange={setRememberMe}
          rememberLabel={t("auth.rememberMe", "Remember me")}
          forgotLabel={t("auth.forgotPassword", "Forgot password?")}
          onForgotPassword={() => toast.info(t("auth.forgotPasswordComingSoon", "Password reset isn't available yet."))}
        />

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-900/20 outline-none transition-all duration-200 hover:from-brand-500 hover:to-brand-600 focus-visible:ring-4 focus-visible:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t("auth.loggingIn") : t("auth.loginButton")}
        </motion.button>

        <div className="flex items-center gap-3 py-1 text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
          {t("auth.orDivider", "Or")}
          <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
        </div>

        <GoogleLoginButton
          onSuccess={() => {
            toast.success(t("auth.loginSuccess"));
            const redirectTo = location.state?.from?.pathname || "/dashboard";
            navigate(redirectTo, { replace: true });
          }}
        />
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        {t("auth.noAccount")}{" "}
        <Link to="/register" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          {t("auth.createOne")}
        </Link>
      </p>
    </div>
  );
}
