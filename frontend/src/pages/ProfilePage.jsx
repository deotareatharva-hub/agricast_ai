import { useAuth } from "../context/AuthContext";
import { useFarms } from "../features/farms/hooks/useFarms";

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

  const initials = (user?.fullName || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-xl font-semibold text-white">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{user?.fullName}</h1>
          <p className="text-sm text-neutral-500">{user?.email}</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
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
      </div>

      <p className="mt-4 text-xs text-neutral-400">
        Profile editing isn't available yet - the backend currently exposes account details as
        read-only.
      </p>
    </div>
  );
}
