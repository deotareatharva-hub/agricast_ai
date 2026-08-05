import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useFarms } from "../hooks/useFarms";
import { useDeleteFarm } from "../hooks/useDeleteFarm";
import FarmCard from "../components/FarmCard";
import EmptyState from "../components/EmptyState";
import FarmListSkeleton from "../components/FarmListSkeleton";
import PageHeader from "../../../components/ui/PageHeader";
import Input from "../../../components/ui/Input";
import ErrorState from "../../../components/ui/ErrorState";
import Dialog from "../../../components/ui/Dialog";
import { buttonClasses } from "../../../components/ui/Button";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";

export default function MyFarmsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [crop, setCrop] = useState("");
  const [farmPendingDelete, setFarmPendingDelete] = useState(null);

  // Debounced so typing a search term doesn't fire a network request on
  // every keystroke (see FrontendAudit.md - "Performance Problems").
  const debouncedSearch = useDebouncedValue(search);
  const debouncedCrop = useDebouncedValue(crop);
  const filters = useMemo(
    () => ({ search: debouncedSearch, crop: debouncedCrop }),
    [debouncedSearch, debouncedCrop]
  );
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
          <Link to="/dashboard/farms/new" className={buttonClasses()}>
            {t("farms.actions.addFarm")}
          </Link>
        }
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("farms.searchPlaceholder")}
          className="sm:max-w-xs"
        />
        <Input
          type="search"
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          placeholder={t("farms.filterCropPlaceholder")}
          className="sm:max-w-xs"
        />
      </div>

      <div className="mt-6">
        {isLoading && <FarmListSkeleton />}

        {isError && <ErrorState message={error?.message || t("farms.loadError")} onRetry={refetch} />}

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

      <Dialog
        open={Boolean(farmPendingDelete)}
        onClose={() => setFarmPendingDelete(null)}
        title={t("farms.deleteConfirmTitle")}
        message={t("farms.deleteConfirmMessage", {
          name: farmPendingDelete?.farmName,
        })}
        confirmLabel={t("farms.actions.delete")}
        isConfirming={deleteFarm.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
