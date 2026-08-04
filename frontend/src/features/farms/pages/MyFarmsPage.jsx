import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useFarms } from "../hooks/useFarms";
import { useDeleteFarm } from "../hooks/useDeleteFarm";
import FarmCard from "../components/FarmCard";
import EmptyState from "../components/EmptyState";
import FarmListSkeleton from "../components/FarmListSkeleton";
import ConfirmDialog from "../components/ConfirmDialog";

export default function MyFarmsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [crop, setCrop] = useState("");
  const [farmPendingDelete, setFarmPendingDelete] = useState(null);

  const filters = useMemo(() => ({ search, crop }), [search, crop]);
  const { data: farms, isLoading, isError, error } = useFarms(filters);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{t("farms.title")}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t("farms.subtitle")}</p>
        </div>
        <Link
          to="/dashboard/farms/new"
          className="focus-ring inline-flex w-fit items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {t("farms.actions.addFarm")}
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("farms.searchPlaceholder")}
          className="focus-ring block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm sm:max-w-xs"
        />
        <input
          type="search"
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          placeholder={t("farms.filterCropPlaceholder")}
          className="focus-ring block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm sm:max-w-xs"
        />
      </div>

      <div className="mt-6">
        {isLoading && <FarmListSkeleton />}

        {isError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error?.message || t("farms.loadError")}
          </p>
        )}

        {!isLoading && !isError && farms?.length === 0 && (
          <EmptyState hasFilters={hasFilters} />
        )}

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
