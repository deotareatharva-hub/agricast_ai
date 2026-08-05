import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Satellite, Calendar, Cloud, ImageIcon } from "lucide-react";
import { formatCaptureDate, daysAgo, formatImageSize, formatCloudCover } from "../utils/satelliteFormatters";
import { cloudCoverToClass } from "../utils/ndviColorMap";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function SatelliteStatistics({ current, className = "" }) {
  const { t } = useTranslation();

  const metadata = current?.metadata;
  const image = current?.image;
  const health = current?.health;

  const stats = [
    {
      icon: Satellite,
      label: t("satellite.stats.provider"),
      value: "Sentinel Hub",
      sub: "Sentinel-2 L2A",
      iconBg: "bg-brand-50",
      iconColor: "text-brand-600",
    },
    {
      icon: Calendar,
      label: t("satellite.stats.lastCapture"),
      value: metadata?.latestCapture ? daysAgo(metadata.latestCapture) : "—",
      sub: formatCaptureDate(metadata?.latestCapture),
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
    },
    {
      icon: Cloud,
      label: t("satellite.stats.cloudCover"),
      value: formatCloudCover(metadata?.avgCloudCover),
      sub:
        metadata?.avgCloudCover != null
          ? metadata.avgCloudCover < 30
            ? t("satellite.cloud.clear")
            : metadata.avgCloudCover < 70
            ? t("satellite.cloud.partial")
            : t("satellite.cloud.cloudy")
          : "—",
      iconBg: "bg-sky-50",
      iconColor: cloudCoverToClass(metadata?.avgCloudCover),
    },
    {
      icon: ImageIcon,
      label: t("satellite.stats.imageSize"),
      value: formatImageSize(image?.sizeBytes),
      sub: image?.mimeType ?? "—",
      iconBg: "bg-neutral-50",
      iconColor: "text-neutral-500",
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${className}`}
    >
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={i}
            variants={item}
            className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.iconBg}`}>
              <Icon className={`h-4 w-4 ${stat.iconColor}`} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">{stat.label}</p>
              <p className="text-lg font-bold text-neutral-900">{stat.value}</p>
              <p className="text-xs text-neutral-400">{stat.sub}</p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
