import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import LpManagerLayout from "./pages/super-admin/LP_Manager/LpManagerLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./pages/auth/AuthPage";
import AdminPortailPage from "./pages/admin/AdminPortailPage";
import NotFound from "./pages/NotFound";
import { ROLES } from "@/lib/supabase";

// Admin pages (super_admin + admin)
import AdminDashboardPage from "./pages/admin/DashboardPage";
import AdminProfilPage from "./pages/admin/ProfilPage";
import AdminMurPage from "./pages/admin/MurPage";
import AdminGestionPersonnelPage from "./pages/admin/GestionPersonnelPage";
import AdminGestionProjetPage from "./pages/admin/GestionProjetPage";
import ProjetsPmoRoute from "./pages/admin/ProjetsPmoRoute";
import AdminPublicationsPage from "./pages/admin/PublicationsPage";
import AdminEvenementsPage from "./pages/admin/evenements";
import AdminMessageriePage from "./pages/admin/MessageriePage";
import AdminBlogsPage from "./pages/admin/BlogsPage";
import GestionFormPage from "./pages/admin/gestion-form";

// Super Admin only
import SuperAdminUsersPage from "./pages/super-admin/SuperAdminUsersPage";
import GestionMembresPage from "./pages/super-admin/GestionMembresPage";
import AssistantIAPage from "./pages/super-admin/AssistantIAPage";
import MediaManagerPage from "./pages/super-admin/MediaManagerPage";
import PMOPage from "./pages/super-admin/PMOPage";
import LpProfilePage from "./pages/super-admin/LP_Manager/LpProfilePage";
import LpLibraryPage from "./pages/super-admin/LP_Manager/LibraryManager/LpLibraryPage";
import LpDashboardPage from "./pages/super-admin/LP_Manager/LpDashboardPage";
import LpEditorLayout from "./pages/super-admin/LP_Manager/LpEditorLayout";
import HeaderEditorPage from "./pages/super-admin/LP_Manager/LPManager/sections/HeaderEditorPage";
import HeroEditorPage from "./pages/super-admin/LP_Manager/LPManager/sections/HeroEditorPage";
import MotDuPresidentEditorPage from "./pages/super-admin/LP_Manager/LPManager/sections/MotDuPresidentEditorPage";
import AProposDuRemessEditorPage from "./pages/super-admin/LP_Manager/LPManager/sections/AProposDuRemessEditorPage";
import RemessEnChiffresEditorPage from "./pages/super-admin/LP_Manager/LPManager/sections/RemessEnChiffresEditorPage";
import EquipeRemessEditorPage from "./pages/super-admin/LP_Manager/LPManager/sections/EquipeRemessEditorPage";
import NosMembresEditorPage from "./pages/super-admin/LP_Manager/LPManager/sections/NosMembresEditorPage";
import NosPartenairesEditorPage from "./pages/super-admin/LP_Manager/LPManager/sections/NosPartenairesEditorPage";
import NosEvenementsEditorPage from "./pages/super-admin/LP_Manager/LPManager/sections/NosEvenementsEditorPage";
import ArticlesEditorPage from "./pages/super-admin/LP_Manager/LPManager/sections/ArticlesEditorPage";
import ContacterNousEditorPage from "./pages/super-admin/LP_Manager/LPManager/sections/ContacterNousEditorPage";
import FooterEditorPage from "./pages/super-admin/LP_Manager/LPManager/sections/FooterEditorPage";
import PublicLibraryPage from "./pages/public-library/PublicLibraryPage";
import PublicLandingPage from "./pages/landing/PublicLandingPage";
import PublicEventRegistrationPage from "./pages/public/PublicEventRegistrationPage";

// Member pages
import MemberDashboardPage from "./pages/admin/member/MemberDashboardPage";
import MemberProfilPage from "./pages/admin/member/MemberProfilPage";

const queryClient = new QueryClient();

/** Entrée /admin ou /super-admin : portail réservé au super admin */
function AdminEntryRedirect() {
  const { profile } = useAuth();
  if (profile?.role === ROLES.SUPER_ADMIN) {
    return <Navigate to="/admin/portail" replace />;
  }
  return <Navigate to="/admin/dashboard" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/" element={<PublicLandingPage />} />
            <Route path="/event/:slug" element={<PublicEventRegistrationPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/bibliotheque" element={<PublicLibraryPage />} />
            <Route
              path="/admin/portail"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                  <AdminPortailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/remess-landing"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                  <LpManagerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="profile" element={<LpProfilePage />} />
              <Route path="library" element={<LpLibraryPage />} />
              <Route path="dashboard" element={<LpDashboardPage />} />
              <Route path="editor" element={<LpEditorLayout />}>
                <Route index element={<Navigate to="hero" replace />} />
                <Route path="header" element={<HeaderEditorPage />} />
                <Route path="hero" element={<HeroEditorPage />} />
                <Route path="mot-du-president" element={<MotDuPresidentEditorPage />} />
                <Route path="a-propos-du-remess" element={<AProposDuRemessEditorPage />} />
                <Route path="remess-en-chiffres" element={<RemessEnChiffresEditorPage />} />
                <Route path="equipe-remess" element={<EquipeRemessEditorPage />} />
                <Route path="nos-membres" element={<NosMembresEditorPage />} />
                <Route path="nos-partenaires" element={<NosPartenairesEditorPage />} />
                <Route path="nos-evenements" element={<NosEvenementsEditorPage />} />
                <Route path="articles" element={<ArticlesEditorPage />} />
                <Route path="contacter-nous" element={<ContacterNousEditorPage />} />
                <Route path="footer" element={<FooterEditorPage />} />
              </Route>
            </Route>
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<AdminEntryRedirect />} />
              <Route path="/super-admin" element={<AdminEntryRedirect />} />
              <Route path="/member" element={<Navigate to="/member/dashboard" replace />} />
              {/* Admin routes: super_admin + admin */}
              <Route path="/admin/profil" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><AdminProfilPage /></ProtectedRoute>} />
              <Route path="/admin/mur" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><AdminMurPage /></ProtectedRoute>} />
              <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/admin/projets/gestion-personnel" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><AdminGestionPersonnelPage /></ProtectedRoute>} />
              <Route path="/admin/projets/gestion-projet" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><AdminGestionProjetPage /></ProtectedRoute>} />
              <Route path="/admin/projets/pmo" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><ProjetsPmoRoute /></ProtectedRoute>} />
              <Route path="/admin/publications" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><AdminPublicationsPage /></ProtectedRoute>} />
              <Route path="/admin/evenements" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><AdminEvenementsPage /></ProtectedRoute>} />
              <Route path="/admin/messagerie" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><AdminMessageriePage /></ProtectedRoute>} />
              <Route path="/admin/blogs" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><AdminBlogsPage /></ProtectedRoute>} />
              <Route path="/admin/gestion-form" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><GestionFormPage /></ProtectedRoute>} />
              {/* Super Admin only */}
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}><SuperAdminUsersPage /></ProtectedRoute>} />
              <Route path="/admin/membres" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}><GestionMembresPage /></ProtectedRoute>} />
              <Route path="/admin/assistant-ia" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}><AssistantIAPage /></ProtectedRoute>} />
              <Route path="/admin/media-manager" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}><MediaManagerPage /></ProtectedRoute>} />
              <Route path="/admin/pmo" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}><PMOPage /></ProtectedRoute>} />
              {/* Member routes */}
              <Route path="/member/dashboard" element={<ProtectedRoute allowedRoles={[ROLES.MEMBER]}><MemberDashboardPage /></ProtectedRoute>} />
              <Route path="/member/mur" element={<ProtectedRoute allowedRoles={[ROLES.MEMBER]}><AdminMurPage /></ProtectedRoute>} />
              <Route path="/member/profil" element={<ProtectedRoute allowedRoles={[ROLES.MEMBER]}><MemberProfilPage /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
