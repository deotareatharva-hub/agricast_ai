import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useCreateFarm } from "../hooks/useCreateFarm";
import FarmForm from "../components/FarmForm";
import PageHeader from "../../../components/ui/PageHeader";
import Card from "../../../components/ui/Card";
import Breadcrumb from "../../../components/ui/Breadcrumb";

export default function AddFarmPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createFarm = useCreateFarm();
  const [serverError, setServerError] = useState("");

  const handleSubmit = async (values) => {
    setServerError("");
    try {
      const response = await createFarm.mutateAsync(values);
      toast.success(t("farms.createSuccess"));
      navigate(`/dashboard/farms/${response.data.farm.id}`, { replace: true });
    } catch (err) {
      setServerError(err.message || t("farms.saveError"));
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        breadcrumb={
          <Breadcrumb items={[{ label: t("farms.title"), to: "/dashboard/farms" }, { label: t("farms.addTitle") }]} />
        }
        title={t("farms.addTitle")}
        subtitle={t("farms.addSubtitle")}
      />

      <Card className="mt-6" padding="lg">
        <FarmForm
          onSubmit={handleSubmit}
          isSubmitting={createFarm.isPending}
          submitLabel={t("farms.actions.save")}
          serverError={serverError}
        />
      </Card>
    </div>
  );
}
