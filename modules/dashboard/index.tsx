import { DashboardLayout } from "./components/DashboardLayout";
import { DashboardView } from "./components/DashboardView";

export function DashboardModule() {
  return (
    <DashboardLayout>
      <DashboardView />
    </DashboardLayout>
  );
}