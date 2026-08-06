import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { getFarmValidationRules, AREA_UNITS } from "../validation/farmSchema";
import LocationPicker from "./LocationPicker";

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

function FieldError({ error }) {
  if (!error) return null;
  return <p className="mt-1 text-xs text-red-600">{error.message}</p>;
}

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
      {serverError && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {serverError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="farmName" className="block text-sm font-medium text-neutral-700">
            {t("farms.fields.farmName")}
          </label>
          <input
            id="farmName"
            type="text"
            className="focus-ring mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            {...register("farmName", rules.farmName)}
          />
          <FieldError error={errors.farmName} />
        </div>

        <div>
          <label htmlFor="crop" className="block text-sm font-medium text-neutral-700">
            {t("farms.fields.crop")}
          </label>
          <input
            id="crop"
            type="text"
            className="focus-ring mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            {...register("crop", rules.crop)}
          />
          <FieldError error={errors.crop} />
        </div>

        <div>
          <label htmlFor="area" className="block text-sm font-medium text-neutral-700">
            {t("farms.fields.area")}
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="area"
              type="number"
              step="0.01"
              className="focus-ring block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              {...register("area", rules.area)}
            />
            <select
              className="focus-ring rounded-md border border-neutral-300 px-2 py-2 text-sm"
              {...register("areaUnit")}
            >
              {AREA_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {t(`farms.areaUnits.${unit}`)}
                </option>
              ))}
            </select>
          </div>
          <FieldError error={errors.area} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="latitude" className="block text-sm font-medium text-neutral-700">
              {t("farms.fields.latitude")}
            </label>
            <input
              id="latitude"
              type="number"
              step="0.000001"
              className="focus-ring mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              {...register("latitude", rules.latitude)}
            />
            <FieldError error={errors.latitude} />
          </div>
          <div>
            <label htmlFor="longitude" className="block text-sm font-medium text-neutral-700">
              {t("farms.fields.longitude")}
            </label>
            <input
              id="longitude"
              type="number"
              step="0.000001"
              className="focus-ring mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              {...register("longitude", rules.longitude)}
            />
            <FieldError error={errors.longitude} />
          </div>
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
        <div>
          <label htmlFor="village" className="block text-sm font-medium text-neutral-700">
            {t("farms.fields.village")}
          </label>
          <input
            id="village"
            type="text"
            className="focus-ring mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            {...register("village", rules.village)}
          />
          <FieldError error={errors.village} />
        </div>

        <div>
          <label htmlFor="district" className="block text-sm font-medium text-neutral-700">
            {t("farms.fields.district")}
          </label>
          <input
            id="district"
            type="text"
            className="focus-ring mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            {...register("district", rules.district)}
          />
          <FieldError error={errors.district} />
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-neutral-700">
            {t("farms.fields.state")}
          </label>
          <input
            id="state"
            type="text"
            className="focus-ring mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            {...register("state", rules.state)}
          />
          <FieldError error={errors.state} />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-neutral-700">
            {t("farms.fields.country")}
          </label>
          <input
            id="country"
            type="text"
            className="focus-ring mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            {...register("country", rules.country)}
          />
          <FieldError error={errors.country} />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="focus-ring w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 sm:w-auto"
      >
        {isSubmitting ? t("farms.saving") : submitLabel}
      </button>
    </form>
  );
}
