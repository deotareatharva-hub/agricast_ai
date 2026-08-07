import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useFarm } from "../hooks/useFarm";
import { useUpdateFarm } from "../hooks/useUpdateFarm";
import FarmForm from "../components/FarmForm";
import Loading from "../../../components/common/Loading";
import PageHeader from "../../../components/ui/PageHeader";
import Card from "../../../components/ui/Card";
import ErrorState from "../../../components/ui/ErrorState";
import Breadcrumb from "../../../components/ui/Breadcrumb";

export default function EditFarmPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: farm, isLoading, isError, error, refetch } = useFarm(id);
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
      <PageHeader
        title={t("farms.editTitle")}
        subtitle={t("farms.editSubtitle")}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t("farms.title"), to: "/dashboard/farms" },
              { label: farm?.farmName || t("farms.editTitle") },
            ]}
          />
        }
      />

      <Card className="mt-6" padding="lg">
        {isLoading && <Loading />}

        {isError && <ErrorState message={error?.message || t("farms.loadError")} onRetry={refetch} />}

        {farm && (
          <FarmForm
            defaultValues={farm}
            onSubmit={handleSubmit}
            isSubmitting={updateFarm.isPending}
            submitLabel={t("farms.actions.saveChanges")}
            serverError={serverError}
          />
        )}
      </Card>
    </div>
  );
}
