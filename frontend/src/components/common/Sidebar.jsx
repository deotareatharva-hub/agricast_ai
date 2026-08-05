import DashboardNav from "./DashboardNav";

// Visual output is unchanged from before this refactor - still a fixed
// 240px column, hidden below md. The nav items themselves now live in
// DashboardNav so the mobile Drawer (see DashboardLayout) can render the
// identical list.
export default function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-neutral-200 bg-white md:block">
      <div className="p-4">
        <DashboardNav />
      </div>
    </aside>
  );
}
