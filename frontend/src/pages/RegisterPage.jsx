import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { AlertCircle, Mail, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AuthField, PasswordInput } from "../components/auth";

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  const password = watch("password");

  const onSubmit = async ({ fullName, email, password }) => {
    setServerError("");
    try {
      await registerUser({ fullName, email, password });
      toast.success(t("auth.registerSuccess"));
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
        {t("auth.registerTitle")}
      </h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t("auth.registerSubtitle")}</p>

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
          id="fullName"
          type="text"
          autoComplete="name"
          icon={User}
          label={t("auth.fullName")}
          error={errors.fullName?.message}
          {...register("fullName", {
            required: t("validation.required"),
            minLength: { value: 2, message: t("validation.minLength", { count: 2 }) },
          })}
        />

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
          autoComplete="new-password"
          label={t("auth.password")}
          error={errors.password?.message}
          {...register("password", {
            required: t("validation.required"),
            minLength: { value: 8, message: t("validation.minLength", { count: 8 }) },
          })}
        />

        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          label={t("auth.confirmPassword")}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword", {
            required: t("validation.required"),
            validate: (value) => value === password || t("validation.passwordMismatch"),
          })}
        />

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-900/20 outline-none transition-all duration-200 hover:from-brand-500 hover:to-brand-600 focus-visible:ring-4 focus-visible:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t("auth.registering") : t("auth.registerButton")}
        </motion.button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        {t("auth.haveAccount")}{" "}
        <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          {t("auth.signIn")}
        </Link>
      </p>
    </div>
  );
}
