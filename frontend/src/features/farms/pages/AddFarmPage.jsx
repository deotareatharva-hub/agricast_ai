import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useCreateFarm } from "../hooks/useCreateFarm";
import FarmForm from "../components/FarmForm";

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
      <h1 className="text-2xl font-semibold text-neutral-900">{t("farms.addTitle")}</h1>
      <p className="mt-1 text-sm text-neutral-500">{t("farms.addSubtitle")}</p>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <FarmForm
          onSubmit={handleSubmit}
          isSubmitting={createFarm.isPending}
          submitLabel={t("farms.actions.save")}
          serverError={serverError}
        />
      </div>
    </div>
  );
}
