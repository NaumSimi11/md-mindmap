import { Outlet } from "react-router-dom";
import { AppHeader } from "./AppHeader";

export function AppLayout() {
  return (
    <div className="min-h-screen w-full bg-background">
      <AppHeader />
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
}