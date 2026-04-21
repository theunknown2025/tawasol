import { Outlet } from "react-router-dom";
import LpEditorSectionsSidebar from "./LpEditorSectionsSidebar";

export default function LpEditorLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <LpEditorSectionsSidebar />
      <div className="min-h-screen min-w-0 flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
