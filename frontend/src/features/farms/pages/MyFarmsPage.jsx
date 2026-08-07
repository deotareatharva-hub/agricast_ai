import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { PlusCircle, Search } from "lucide-react";
import { useFarms } from "../hooks/useFarms";
import { useDeleteFarm } from "../hooks/useDeleteFarm";
import FarmCard from "../components/FarmCard";
import EmptyState from "../components/EmptyState";
import FarmListSkeleton from "../components/FarmListSkeleton";
import ConfirmDialog from "../components/ConfirmDialog";
import PageHeader from "../../../components/ui/PageHeader";
import ErrorState from "../../../components/ui/ErrorState";
import Input from "../../../components/ui/Input";

export default function MyFarmsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [crop, setCrop] = useState("");
  const [farmPendingDelete, setFarmPendingDelete] = useState(null);

  const filters = useMemo(() => ({ search, crop }), [search, crop]);
  const { data: farms, isLoading, isError, error, refetch } = useFarms(filters);
  const deleteFarm = useDeleteFarm();

  const hasFilters = Boolean(search || crop);

  const handleConfirmDelete = async () => {
    if (!farmPendingDelete) return;
    try {
      await deleteFarm.mutateAsync(farmPendingDelete.id);
      toast.success(t("farms.deleteSuccess"));
      setFarmPendingDelete(null);
    } catch (err) {
      toast.error(err.message || t("farms.deleteError"));
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t("farms.title")}
        subtitle={t("farms.subtitle")}
        actions={
          <Link
            to="/dashboard/farms/new"
            className="focus-ring inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-b from-brand-500 to-brand-600 px-4.5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-glow-brand)] transition hover:brightness-105"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            {t("farms.actions.addFarm")}
          </Link>
        }
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("farms.searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <Input
          type="search"
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          placeholder={t("farms.filterCropPlaceholder")}
          className="w-full sm:max-w-xs"
        />
      </div>

      <div className="mt-6">
        {isLoading && <FarmListSkeleton />}

        {isError && <ErrorState message={error?.message || t("farms.loadError")} onRetry={refetch} />}

        {!isLoading && !isError && farms?.length === 0 && <EmptyState hasFilters={hasFilters} />}

        {!isLoading && !isError && farms?.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {farms.map((farm) => (
              <FarmCard key={farm.id} farm={farm} onDeleteClick={setFarmPendingDelete} />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(farmPendingDelete)}
        title={t("farms.deleteConfirmTitle")}
        message={t("farms.deleteConfirmMessage", {
          name: farmPendingDelete?.farmName,
        })}
        confirmLabel={t("farms.actions.delete")}
        isConfirming={deleteFarm.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setFarmPendingDelete(null)}
      />
    </div>
  );
}
