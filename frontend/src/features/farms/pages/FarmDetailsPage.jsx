import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useFarm } from "../hooks/useFarm";
import { useDeleteFarm } from "../hooks/useDeleteFarm";
import LocationPicker from "../components/LocationPicker";
import ConfirmDialog from "../components/ConfirmDialog";
import Loading from "../../../components/common/Loading";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import ErrorState from "../../../components/ui/ErrorState";

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right font-medium text-neutral-900">{value || "—"}</dd>
    </div>
  );
}

export default function FarmDetailsPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: farm, isLoading, isError, error, refetch } = useFarm(id);
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

  if (isLoading) return <Loading />;

  if (isError) {
    return <ErrorState message={error?.message || t("farms.loadError")} onRetry={refetch} />;
  }

  if (!farm) return null;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/dashboard/farms"
          className="focus-ring inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("farms.backToList")}
        </Link>
        <div className="flex gap-3">
          <Link to={`/dashboard/farms/${farm.id}/edit`} className="focus-ring">
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4" aria-hidden="true" />
              {t("farms.actions.edit")}
            </Button>
          </Link>
          <Button variant="dangerOutline" size="sm" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {t("farms.actions.delete")}
          </Button>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-[-0.01em] text-neutral-900 sm:text-3xl">{farm.farmName}</h1>
        <Badge>{farm.crop}</Badge>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Card>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            {t("farms.details.overview")}
          </h2>
          <dl className="mt-1 divide-y divide-neutral-100">
            <DetailRow label={t("farms.fields.area")} value={`${farm.area} ${t(`farms.areaUnits.${farm.areaUnit}`)}`} />
            <DetailRow label={t("farms.fields.village")} value={farm.village} />
            <DetailRow label={t("farms.fields.district")} value={farm.district} />
            <DetailRow label={t("farms.fields.state")} value={farm.state} />
            <DetailRow label={t("farms.fields.country")} value={farm.country} />
            <DetailRow label={t("farms.fields.latitude")} value={farm.latitude} />
            <DetailRow label={t("farms.fields.longitude")} value={farm.longitude} />
          </dl>
        </Card>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
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
