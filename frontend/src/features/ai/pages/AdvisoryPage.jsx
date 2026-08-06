import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useLatestRecommendation } from "../hooks/useLatestRecommendation";
import { useRecommendationHistory } from "../hooks/useRecommendationHistory";
import { useGenerateRecommendation } from "../hooks/useGenerateRecommendation";
import RecommendationCard from "../components/RecommendationCard";
import RecommendationHistoryList from "../components/RecommendationHistoryList";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";

export default function AdvisoryPage() {
  const { farm } = useOutletContext();
  const { i18n } = useTranslation();

  const latestQuery = useLatestRecommendation(farm.id);
  const historyQuery = useRecommendationHistory(farm.id, { limit: 10 });
  const generate = useGenerateRecommendation(farm.id);

  const handleGenerate = async () => {
    try {
      await generate.mutateAsync({ language: i18n.resolvedLanguage || "en" });
      toast.success("New recommendation generated");
    } catch (err) {
      toast.error(err.message || "Could not generate a recommendation. Please try again.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          AI Advisory
        </h2>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generate.isPending}
          className="focus-ring rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {generate.isPending ? "Generating…" : "Generate new recommendation"}
        </button>
      </div>

      {latestQuery.isLoading ? (
        <Loading label="Loading latest recommendation…" />
      ) : latestQuery.isError ? (
        <ErrorState
          message={latestQuery.error?.message || "Could not load AI recommendations."}
          onRetry={() => latestQuery.refetch()}
        />
      ) : latestQuery.data ? (
        <RecommendationCard recommendation={latestQuery.data} />
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
          <p className="text-sm text-neutral-500">
            No recommendation yet for this farm. Generate the first one above.
          </p>
        </div>
      )}

      {generate.isPending && (
        <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          Analyzing weather, satellite, and sensor data for this farm…
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          History
        </h2>
        {historyQuery.isLoading ? (
          <p className="text-sm text-neutral-500">Loading history…</p>
        ) : historyQuery.isError ? (
          <p className="text-sm text-neutral-500">Could not load recommendation history.</p>
        ) : (
          <RecommendationHistoryList history={historyQuery.data} />
        )}
      </div>
    </div>
  );
}
