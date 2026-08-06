import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useFarm } from "../hooks/useFarm";
import { useUpdateFarm } from "../hooks/useUpdateFarm";
import FarmForm from "../components/FarmForm";
import Loading from "../../../components/common/Loading";

export default function EditFarmPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: farm, isLoading, isError, error } = useFarm(id);
  const updateFarm = useUpdateFarm();
  const [serverError, setServerError] = useState("");

  const handleSubmit = async (values) => {
    setServerError("");
    try {
      await updateFarm.mutateAsync({ id, payload: values });
      toast.success(t("farms.updateSuccess"));
      navigate(`/dashboard/farms/${id}`, { replace: true });
    } catch (err) {
      setServerError(err.message || t("farms.saveError"));
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-neutral-900">{t("farms.editTitle")}</h1>
      <p className="mt-1 text-sm text-neutral-500">{t("farms.editSubtitle")}</p>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        {isLoading && <Loading />}

        {isError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error?.message || t("farms.loadError")}
          </p>
        )}

        {farm && (
          <FarmForm
            defaultValues={farm}
            onSubmit={handleSubmit}
            isSubmitting={updateFarm.isPending}
            submitLabel={t("farms.actions.saveChanges")}
            serverError={serverError}
          />
        )}
      </div>
    </div>
  );
}
