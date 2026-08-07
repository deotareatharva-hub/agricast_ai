import { motion } from "framer-motion";
import { Sprout, Mail, Calendar } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useFarms } from "../features/farms/hooks/useFarms";
import Card from "../components/ui/Card";
import Avatar from "../components/ui/Avatar";
import StatCard from "../components/ui/StatCard";

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium text-neutral-900">{value}</dd>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: farms } = useFarms();

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 text-white shadow-[var(--shadow-soft-lg)] sm:p-7"
      >
        <div className="bg-noise-overlay absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="relative flex items-center gap-4">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-white/30" referrerPolicy="no-referrer" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-xl font-bold ring-2 ring-white/30">
              {(user?.fullName || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-[-0.01em] sm:text-2xl">{user?.fullName}</h1>
            <p className="text-sm text-white/70">{user?.email}</p>
          </div>
        </div>
      </motion.div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard icon={Sprout} label="Farms tracked" value={farms?.length ?? "—"} />
        <StatCard
          icon={Calendar}
          label="Member since"
          value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString([], { dateStyle: "medium" }) : "—"}
          accent="info"
        />
      </div>

      <Card className="mt-6">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
          Account
        </h2>
        <dl className="mt-2 divide-y divide-neutral-100">
          <InfoRow label="Full name" value={user?.fullName} />
          <InfoRow label="Email" value={user?.email} />
          <InfoRow label="Farms tracked" value={farms?.length ?? "—"} />
          {user?.createdAt && (
            <InfoRow
              label="Member since"
              value={new Date(user.createdAt).toLocaleDateString([], {
                dateStyle: "medium",
              })}
            />
          )}
        </dl>
      </Card>

      <p className="mt-4 text-xs text-neutral-400">
        Profile editing isn't available yet - the backend currently exposes account details as
        read-only.
      </p>
    </div>
  );
}
