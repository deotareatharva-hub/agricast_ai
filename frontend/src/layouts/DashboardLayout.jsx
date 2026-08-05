import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import DashboardNav from "../components/common/DashboardNav";
import Drawer from "../components/ui/Drawer";
import { useDisclosure } from "../hooks/useDisclosure";

// Shell for every authenticated page. Future feature modules render inside
// the <Outlet /> without needing to touch this layout.
//
// Below md, Sidebar renders nothing (it's `hidden md:block`), so this now
// adds its own compact bar with a menu button that opens the same nav
// links in a Drawer - previously there was no way to reach
// /dashboard/farms on a phone except by typing the URL directly.
export default function DashboardLayout() {
  const { t } = useTranslation();
  const drawer = useDisclosure();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <div className="border-b border-neutral-200 bg-white px-4 py-2 md:hidden">
        <button
          type="button"
          onClick={drawer.open}
          className="focus-ring inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
          {t("common.openMenu")}
        </button>
      </div>

      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-neutral-50 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <Drawer open={drawer.isOpen} onClose={drawer.close} title={t("app.name")}>
        <DashboardNav onNavigate={drawer.close} />
      </Drawer>
    </div>
  );
}
