import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import AuthPage from "./pages/auth/AuthPage";
import ProfilPage from "./pages/profil/ProfilPage";
import MurPage from "./pages/mur/MurPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import GestionPersonnelPage from "./pages/projets/GestionPersonnelPage";
import GestionProjetPage from "./pages/projets/GestionProjetPage";
import PublicationsPage from "./pages/publications/PublicationsPage";
import EvenementsPage from "./pages/evenements/EvenementsPage";
import MessageriePage from "./pages/messagerie/MessageriePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route element={<AppLayout />}>
            <Route path="/profil" element={<ProfilPage />} />
            <Route path="/mur" element={<MurPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projets/gestion-personnel" element={<GestionPersonnelPage />} />
            <Route path="/projets/gestion-projet" element={<GestionProjetPage />} />
            <Route path="/publications" element={<PublicationsPage />} />
            <Route path="/evenements" element={<EvenementsPage />} />
            <Route path="/messagerie" element={<MessageriePage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
