/**
 * Aplicativo de Atas - Sacramental e Batismal
 * Design: Minimalismo Espiritual Contemporâneo
 * Multi-Tenant: Isolamento por ala via Firebase Auth
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { WardProvider, useWard } from "./contexts/WardContext";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import History from "./pages/History";
import View from "./pages/View";
import SpeakerStats from "./pages/SpeakerStats";
import BaptismalHome from "./pages/baptismal/BaptismalHome";
import BaptismalHistory from "./pages/baptismal/BaptismalHistory";
import BaptismalView from "./pages/baptismal/BaptismalView";
import BishopricHome from "./pages/bishopric/BishopricHome";
import BishopricHistory from "./pages/bishopric/BishopricHistory";
import BishopricView from "./pages/bishopric/BishopricView";
import BishopricInterviews from "./pages/bishopric/BishopricInterviews";
import BishopricInterviewsHistory from "./pages/bishopric/BishopricInterviewsHistory";
import WardCouncilHome from "./pages/wardcouncil/WardCouncilHome";
import WardCouncilHistory from "./pages/wardcouncil/WardCouncilHistory";
import WardCouncilView from "./pages/wardcouncil/WardCouncilView";
import SpeakerInvitation from "./pages/SpeakerInvitation";
import { Loader2 } from "lucide-react";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/sacramental"} component={Home} />
      <Route path={"/sacramental/history"} component={History} />
      <Route path={"/sacramental/stats"} component={SpeakerStats} />
      <Route path={"/sacramental/convite"} component={SpeakerInvitation} />
      <Route path={"/sacramental/view/:id"} component={View} />
      <Route path={"/baptismal"} component={BaptismalHome} />
      <Route path={"/baptismal/history"} component={BaptismalHistory} />
      <Route path={"/baptismal/view/:id"} component={BaptismalView} />
      <Route path={"/bishopric"} component={BishopricHome} />
      <Route path={"/bishopric/history"} component={BishopricHistory} />
      <Route path={"/bishopric/view/:id"} component={BishopricView} />
      <Route path={"/bishopric/interviews"} component={BishopricInterviews} />
      <Route path={"/bishopric/interviews/history"} component={BishopricInterviewsHistory} />
      <Route path={"/wardcouncil"} component={WardCouncilHome} />
      <Route path={"/wardcouncil/history"} component={WardCouncilHistory} />
      <Route path={"/wardcouncil/view/:id"} component={WardCouncilView} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: Design Theme - Minimalismo Espiritual Contemporâneo
// - Light theme with elegant primary and accent colors
// - Playfair Display for headings (serif elegance)
// - Poppins for body text (clean readability)
// - Reverent spacing and minimalist aesthetic

/**
 * AppContent - Verifica autenticação antes de renderizar rotas
 */
function AppContent() {
  const { isLoading } = useWard();

  // Loading de autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Renderizar rotas normalmente (login desativado)
  return <Router />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <WardProvider>
          <TooltipProvider>
            <Toaster />
            <AppContent />
          </TooltipProvider>
        </WardProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
