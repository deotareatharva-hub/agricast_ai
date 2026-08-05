import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import Field from "../components/ui/Field";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ErrorState from "../components/ui/ErrorState";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState("");

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
      <h1 className="text-2xl font-semibold text-neutral-900">
        {t("auth.loginTitle")}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">{t("auth.loginSubtitle")}</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError && <ErrorState message={serverError} />}

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
            autoComplete="current-password"
            invalid={Boolean(errors.password)}
            {...register("password", { required: t("validation.required") })}
          />
        </Field>

        <Button type="submit" fullWidth isLoading={isSubmitting}>
          {isSubmitting ? t("auth.loggingIn") : t("auth.loginButton")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        {t("auth.noAccount")}{" "}
        <Link to="/register" className="font-medium text-brand-700 hover:underline">
          {t("auth.createOne")}
        </Link>
      </p>
    </div>
  );
}
