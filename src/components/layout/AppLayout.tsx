import { Outlet } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppLayout() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="hidden lg:block lg:w-64 lg:shrink-0">
        <div className="fixed inset-y-0 left-0 w-64">
          <Sidebar />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 h-[calc(100vh-64px)] flex flex-col overflow-hidden">
          <div className="w-full h-full animate-in fade-in duration-500 flex flex-col overflow-y-auto overflow-x-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
