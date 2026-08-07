import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useLatestRecommendation } from "../hooks/useLatestRecommendation";
import { useRecommendationHistory } from "../hooks/useRecommendationHistory";
import { useGenerateRecommendation } from "../hooks/useGenerateRecommendation";
import RecommendationCard from "../components/RecommendationCard";
import RecommendationHistoryList from "../components/RecommendationHistoryList";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";

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
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">AI Advisory</h2>
        <Button onClick={handleGenerate} isLoading={generate.isPending}>
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {generate.isPending ? "Generating…" : "Generate new recommendation"}
        </Button>
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
        <EmptyState
          icon={Sparkles}
          title="No recommendation yet"
          description="Generate the first AI recommendation for this farm above."
        />
      )}

      {generate.isPending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2.5 rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3.5 text-sm font-medium text-brand-700"
        >
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="flex h-4 w-4 items-center justify-center"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </motion.span>
          Analyzing weather, satellite, and sensor data for this farm…
        </motion.div>
      )}

      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-400">History</h2>
        {historyQuery.isLoading ? (
          <p className="text-sm text-neutral-400">Loading history…</p>
        ) : historyQuery.isError ? (
          <p className="text-sm text-neutral-400">Could not load recommendation history.</p>
        ) : (
          <RecommendationHistoryList history={historyQuery.data} />
        )}
      </div>
    </div>
  );
}
