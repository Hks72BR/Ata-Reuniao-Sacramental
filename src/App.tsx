/**
 * Aplicativo de Atas - Sacramental e Batismal
 * Design: Minimalismo Espiritual Contemporâneo
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useServiceWorker } from "./hooks/useServiceWorker";
import { WifiOff, Wifi } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import History from "./pages/History";
import View from "./pages/View";
import BaptismalHome from "./pages/baptismal/BaptismalHome";
import BaptismalHistory from "./pages/baptismal/BaptismalHistory";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/sacramental"} component={Home} />
      <Route path={"/sacramental/history"} component={History} />
      <Route path={"/sacramental/view"} component={View} />
      <Route path={"/baptismal"} component={BaptismalHome} />
      <Route path={"/baptismal/history"} component={BaptismalHistory} />
      <Route path={"/baptismal/view"} component={() => <div className="p-8 text-center">Visualização Batismal em desenvolvimento</div>} />
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

function App() {
  const { isOnline, swReady } = useServiceWorker();

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          
          {/* Indicador de Status Offline/Online */}
          {swReady && (
            <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 ${
              isOnline 
                ? 'bg-emerald-500/90 text-white' 
                : 'bg-orange-500/90 text-white animate-pulse'
            }`}>
              {isOnline ? (
                <>
                  <Wifi size={16} />
                  <span className="text-xs font-semibold">Online</span>
                </>
              ) : (
                <>
                  <WifiOff size={16} />
                  <span className="text-xs font-semibold">Modo Offline</span>
                </>
              )}
            </div>
          )}
          
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
