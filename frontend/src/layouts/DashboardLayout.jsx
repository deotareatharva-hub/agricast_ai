import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import DashboardTopbar from "../components/common/DashboardTopbar";
import Sidebar, { SidebarNavLinks } from "../components/common/Sidebar";
import Drawer from "../components/ui/Drawer";

// Shell for every authenticated page. Feature modules render inside the
// <Outlet /> without needing to touch this layout - route tree in App.jsx
// is unchanged, this only changes what wraps it.
export default function DashboardLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardTopbar onOpenNav={() => setMobileNavOpen(true)} />

      <Drawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} title="AgriCast AI">
        <SidebarNavLinks onNavigate={() => setMobileNavOpen(false)} />
      </Drawer>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 gap-4 px-3 pb-6 pt-4 sm:px-4 lg:px-6">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
