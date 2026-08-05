import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { CloudSun } from "lucide-react";
import { useFarm } from "../hooks/useFarm";
import { useDeleteFarm } from "../hooks/useDeleteFarm";
import LocationPicker from "../components/LocationPicker";
import Loading from "../../../components/common/Loading";
import PageHeader from "../../../components/ui/PageHeader";
import Breadcrumb from "../../../components/ui/Breadcrumb";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import ErrorState from "../../../components/ui/ErrorState";
import Dialog from "../../../components/ui/Dialog";
import { useDisclosure } from "../../../hooks/useDisclosure";

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
  const { data: farm, isLoading, isError, error, refetch } = useFarm(id);
  const deleteFarm = useDeleteFarm();
  const confirmDialog = useDisclosure();

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
    return <ErrorState message={error?.message || t("farms.loadError")} onRetry={refetch} />;
  }

  if (!farm) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: t("farms.title"), to: "/dashboard/farms" }, { label: farm.farmName }]} />}
        title={farm.farmName}
        subtitle={farm.crop}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate(`/dashboard/farms/${farm.id}/weather`)}>
              <CloudSun className="h-4 w-4" aria-hidden="true" />
              {t("farms.actions.weather")}
            </Button>
            <Button variant="outline" onClick={() => navigate(`/dashboard/farms/${farm.id}/edit`)}>
              {t("farms.actions.edit")}
            </Button>
            <Button variant="dangerOutline" onClick={confirmDialog.open}>
              {t("farms.actions.delete")}
            </Button>
          </>
        }
      />

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Card>
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
        </Card>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {t("farms.fields.location")}
          </h2>
          <div className="mt-2">
            <LocationPicker latitude={farm.latitude} longitude={farm.longitude} onChange={() => {}} />
          </div>
        </div>
      </div>

      <Dialog
        open={confirmDialog.isOpen}
        onClose={confirmDialog.close}
        title={t("farms.deleteConfirmTitle")}
        message={t("farms.deleteConfirmMessage", { name: farm.farmName })}
        confirmLabel={t("farms.actions.delete")}
        isConfirming={deleteFarm.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
