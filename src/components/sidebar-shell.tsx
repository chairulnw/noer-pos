"use client";

import { useSyncExternalStore } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

const KEY = "sidebar-collapsed";
const subscribe = (cb: () => void) => {
  window.addEventListener("sidebar-toggle", cb);
  return () => window.removeEventListener("sidebar-toggle", cb);
};
const read = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

export function SidebarShell({ logo, bell, children }: { logo: React.ReactNode; bell?: React.ReactNode; children: React.ReactNode }) {
  const collapsed = useSyncExternalStore(subscribe, read, () => false);
  const toggle = () => {
    try {
      localStorage.setItem(KEY, collapsed ? "0" : "1");
    } catch {}
    window.dispatchEvent(new Event("sidebar-toggle"));
  };
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      data-collapsed={collapsed}
      className="group/side flex flex-col border-b border-sidebar-border bg-sidebar px-3 py-5 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0 md:transition-[width] md:data-[collapsed=true]:w-[72px]"
    >
      <div className="flex items-center justify-between pb-4 pl-2.5 md:group-data-[collapsed=true]/side:justify-center md:group-data-[collapsed=true]/side:pl-0">
        <div className="md:group-data-[collapsed=true]/side:hidden">{logo}</div>
        <div className="flex items-center md:group-data-[collapsed=true]/side:flex-col">
        {bell}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Perluas menu" : "Ciutkan menu"}
          aria-expanded={!collapsed}
          title={collapsed ? "Perluas menu" : "Ciutkan menu"}
          className="hidden size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted md:flex"
        >
          <Icon className="size-[18px]" />
        </button>
        </div>
      </div>
      {children}
    </aside>
  );
}
