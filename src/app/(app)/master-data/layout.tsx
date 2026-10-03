import { MasterTabs } from "./master-tabs";

export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold leading-11">Master Data</h1>
      <MasterTabs />
      {children}
    </div>
  );
}
