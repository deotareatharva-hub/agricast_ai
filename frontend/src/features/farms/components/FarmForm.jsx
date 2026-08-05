import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { getFarmValidationRules, AREA_UNITS } from "../validation/farmSchema";
import LocationPicker from "./LocationPicker";
import Field from "../../../components/ui/Field";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";
import ErrorState from "../../../components/ui/ErrorState";

const DEFAULT_VALUES = {
  farmName: "",
  crop: "",
  area: "",
  areaUnit: "acres",
  latitude: "",
  longitude: "",
  village: "",
  district: "",
  state: "",
  country: "",
};

// Shared form for both "Add Farm" and "Edit Farm" pages. The caller owns
// the mutation (create vs update) and passes it in as onSubmit.
export default function FarmForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  serverError,
}) {
  const { t } = useTranslation();
  const rules = getFarmValidationRules(t);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: { ...DEFAULT_VALUES, ...defaultValues },
  });

  const latitude = watch("latitude");
  const longitude = watch("longitude");

  const handleMapChange = (lat, lng) => {
    setValue("latitude", Number(lat.toFixed(6)), { shouldValidate: true, shouldDirty: true });
    setValue("longitude", Number(lng.toFixed(6)), { shouldValidate: true, shouldDirty: true });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      {serverError && <ErrorState message={serverError} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("farms.fields.farmName")} htmlFor="farmName" error={errors.farmName}>
          <Input id="farmName" type="text" invalid={Boolean(errors.farmName)} {...register("farmName", rules.farmName)} />
        </Field>

        <Field label={t("farms.fields.crop")} htmlFor="crop" error={errors.crop}>
          <Input id="crop" type="text" invalid={Boolean(errors.crop)} {...register("crop", rules.crop)} />
        </Field>

        <Field label={t("farms.fields.area")} htmlFor="area" error={errors.area}>
          <div className="flex gap-2">
            <Input
              id="area"
              type="number"
              step="0.01"
              invalid={Boolean(errors.area)}
              {...register("area", rules.area)}
            />
            <Select {...register("areaUnit")}>
              {AREA_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {t(`farms.areaUnits.${unit}`)}
                </option>
              ))}
            </Select>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label={t("farms.fields.latitude")} htmlFor="latitude" error={errors.latitude}>
            <Input
              id="latitude"
              type="number"
              step="0.000001"
              invalid={Boolean(errors.latitude)}
              {...register("latitude", rules.latitude)}
            />
          </Field>
          <Field label={t("farms.fields.longitude")} htmlFor="longitude" error={errors.longitude}>
            <Input
              id="longitude"
              type="number"
              step="0.000001"
              invalid={Boolean(errors.longitude)}
              {...register("longitude", rules.longitude)}
            />
          </Field>
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium text-neutral-700">
          {t("farms.fields.location")}
        </span>
        <div className="mt-1">
          <LocationPicker
            latitude={typeof latitude === "number" ? latitude : Number(latitude)}
            longitude={typeof longitude === "number" ? longitude : Number(longitude)}
            onChange={handleMapChange}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("farms.fields.village")} htmlFor="village" error={errors.village}>
          <Input id="village" type="text" invalid={Boolean(errors.village)} {...register("village", rules.village)} />
        </Field>

        <Field label={t("farms.fields.district")} htmlFor="district" error={errors.district}>
          <Input id="district" type="text" invalid={Boolean(errors.district)} {...register("district", rules.district)} />
        </Field>

        <Field label={t("farms.fields.state")} htmlFor="state" error={errors.state}>
          <Input id="state" type="text" invalid={Boolean(errors.state)} {...register("state", rules.state)} />
        </Field>

        <Field label={t("farms.fields.country")} htmlFor="country" error={errors.country}>
          <Input id="country" type="text" invalid={Boolean(errors.country)} {...register("country", rules.country)} />
        </Field>
      </div>

      <Button type="submit" fullWidth isLoading={isSubmitting} className="sm:w-auto">
        {isSubmitting ? t("farms.saving") : submitLabel}
      </Button>
    </form>
  );
}
