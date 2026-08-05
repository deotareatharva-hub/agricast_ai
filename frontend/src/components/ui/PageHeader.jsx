// MyFarmsPage, AddFarmPage, EditFarmPage, FarmDetailsPage and DashboardPage
// each hand-rolled their own "<h1> + subtitle + optional action" header.
// This is that pattern, once. `breadcrumb` accepts a <Breadcrumb /> element
// so pages that need one (FarmDetailsPage, EditFarmPage) can slot it above
// the title without every page paying for it.
export default function PageHeader({ title, subtitle, actions, breadcrumb, className = "" }) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div>
        {breadcrumb}
        <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}
