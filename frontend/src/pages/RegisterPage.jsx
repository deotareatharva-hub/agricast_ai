import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

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
      <h1 className="text-2xl font-semibold text-neutral-900">
        {t("auth.registerTitle")}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">{t("auth.registerSubtitle")}</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {serverError}
          </div>
        )}

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700">
            {t("auth.fullName")}
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            className="focus-ring mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            {...register("fullName", {
              required: t("validation.required"),
              minLength: { value: 2, message: t("validation.minLength", { count: 2 }) },
            })}
          />
          {errors.fullName && (
            <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
            {t("auth.email")}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="focus-ring mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            {...register("email", {
              required: t("validation.required"),
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: t("validation.invalidEmail"),
              },
            })}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
            {t("auth.password")}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="focus-ring mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            {...register("password", {
              required: t("validation.required"),
              minLength: { value: 8, message: t("validation.minLength", { count: 8 }) },
            })}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
            {t("auth.confirmPassword")}
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="focus-ring mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            {...register("confirmPassword", {
              required: t("validation.required"),
              validate: (value) =>
                value === password || t("validation.passwordMismatch"),
            })}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="focus-ring w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isSubmitting ? t("auth.registering") : t("auth.registerButton")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        {t("auth.haveAccount")}{" "}
        <Link to="/login" className="font-medium text-brand-700 hover:underline">
          {t("auth.signIn")}
        </Link>
      </p>
    </div>
  );
}
