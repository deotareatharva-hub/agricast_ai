import { Link } from "react-router-dom";
import {
  CloudSun,
  Satellite,
 Bot,
  BarChart3,
  FileText,
  Tractor,
} from "lucide-react";

const actions = [
  {
    title: "Weather",
    subtitle: "Forecast & Alerts",
    icon: CloudSun,
    color: "from-sky-500 to-cyan-500",
    link: "/dashboard/weather",
  },
  {
    title: "Satellite",
    subtitle: "View Farm",
    icon: Satellite,
    color: "from-green-500 to-emerald-600",
    link: "/dashboard/satellite",
  },
  {
    title: "AI Advisor",
    subtitle: "Today's Advice",
    icon: Bot,
    color: "from-violet-500 to-purple-600",
    link: "/dashboard/ai",
  },
  {
    title: "Analytics",
    subtitle: "Insights",
    icon: BarChart3,
    color: "from-orange-500 to-amber-500",
    link: "/dashboard/analytics",
  },
  {
    title: "Reports",
    subtitle: "Generate PDF",
    icon: FileText,
    color: "from-red-500 to-rose-500",
    link: "/dashboard/reports",
  },
  {
    title: "My Farms",
    subtitle: "Manage Farms",
    icon: Tractor,
    color: "from-lime-500 to-green-600",
    link: "/dashboard/farms",
  },
];

export default function QuickActions() {
  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {actions.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.title}
            to={item.link}
            className="group overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div
              className={`h-2 w-full bg-gradient-to-r ${item.color}`}
            />

            <div className="flex flex-col items-center p-6 text-center">
              <div
                className={`mb-4 rounded-2xl bg-gradient-to-r ${item.color} p-4 text-white shadow-lg`}
              >
                <Icon size={28} />
              </div>

              <h3 className="font-semibold text-gray-900">
                {item.title}
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                {item.subtitle}
              </p>
            </div>
          </Link>
        );
      })}
    </section>
  );
}