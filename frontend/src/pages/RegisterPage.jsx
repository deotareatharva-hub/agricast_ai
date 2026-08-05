import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import Field from "../components/ui/Field";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ErrorState from "../components/ui/ErrorState";

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
        {serverError && <ErrorState message={serverError} />}

        <Field label={t("auth.fullName")} htmlFor="fullName" error={errors.fullName}>
          <Input
            id="fullName"
            type="text"
            autoComplete="name"
            invalid={Boolean(errors.fullName)}
            {...register("fullName", {
              required: t("validation.required"),
              minLength: { value: 2, message: t("validation.minLength", { count: 2 }) },
            })}
          />
        </Field>

        <Field label={t("auth.email")} htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            invalid={Boolean(errors.email)}
            {...register("email", {
              required: t("validation.required"),
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: t("validation.invalidEmail"),
              },
            })}
          />
        </Field>

        <Field label={t("auth.password")} htmlFor="password" error={errors.password}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            invalid={Boolean(errors.password)}
            {...register("password", {
              required: t("validation.required"),
              minLength: { value: 8, message: t("validation.minLength", { count: 8 }) },
            })}
          />
        </Field>

        <Field
          label={t("auth.confirmPassword")}
          htmlFor="confirmPassword"
          error={errors.confirmPassword}
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            invalid={Boolean(errors.confirmPassword)}
            {...register("confirmPassword", {
              required: t("validation.required"),
              validate: (value) => value === password || t("validation.passwordMismatch"),
            })}
          />
        </Field>

        <Button type="submit" fullWidth isLoading={isSubmitting}>
          {isSubmitting ? t("auth.registering") : t("auth.registerButton")}
        </Button>
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
