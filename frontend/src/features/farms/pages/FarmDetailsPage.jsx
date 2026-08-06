import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useFarm } from "../hooks/useFarm";
import { useDeleteFarm } from "../hooks/useDeleteFarm";
import LocationPicker from "../components/LocationPicker";
import ConfirmDialog from "../components/ConfirmDialog";
import Loading from "../../../components/common/Loading";

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right font-medium text-neutral-900">{value}</dd>
    </div>
  );
}

export default function FarmDetailsPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: farm, isLoading, isError, error } = useFarm(id);
  const deleteFarm = useDeleteFarm();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteFarm.mutateAsync(id);
      toast.success(t("farms.deleteSuccess"));
      navigate("/dashboard/farms", { replace: true });
    } catch (err) {
      toast.error(err.message || t("farms.deleteError"));
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return (
      <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
        {error?.message || t("farms.loadError")}
      </p>
    );
  }

  if (!farm) return null;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/dashboard/farms"
          className="focus-ring text-sm font-medium text-brand-700 hover:underline"
        >
          {t("farms.backToList")}
        </Link>
        <div className="flex gap-3">
          <Link
            to={`/dashboard/farms/${farm.id}/edit`}
            className="focus-ring rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {t("farms.actions.edit")}
          </Link>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="focus-ring rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            {t("farms.actions.delete")}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {t("farms.details.overview")}
          </h2>
          <dl className="mt-2 divide-y divide-neutral-100">
            <DetailRow label={t("farms.fields.area")} value={`${farm.area} ${t(`farms.areaUnits.${farm.areaUnit}`)}`} />
            <DetailRow label={t("farms.fields.village")} value={farm.village} />
            <DetailRow label={t("farms.fields.district")} value={farm.district} />
            <DetailRow label={t("farms.fields.state")} value={farm.state} />
            <DetailRow label={t("farms.fields.country")} value={farm.country} />
            <DetailRow label={t("farms.fields.latitude")} value={farm.latitude} />
            <DetailRow label={t("farms.fields.longitude")} value={farm.longitude} />
          </dl>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {t("farms.fields.location")}
          </h2>
          <div className="mt-2">
            <LocationPicker latitude={farm.latitude} longitude={farm.longitude} onChange={() => {}} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={t("farms.deleteConfirmTitle")}
        message={t("farms.deleteConfirmMessage", { name: farm.farmName })}
        confirmLabel={t("farms.actions.delete")}
        isConfirming={deleteFarm.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
