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
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import History from "./pages/History";
import View from "./pages/View";
import BaptismalHome from "./pages/baptismal/BaptismalHome";
import BaptismalHistory from "./pages/baptismal/BaptismalHistory";
import BaptismalView from "./pages/baptismal/BaptismalView";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/sacramental"} component={Home} />
      <Route path={"/sacramental/history"} component={History} />
      <Route path={"/sacramental/view/:id"} component={View} />
      <Route path={"/baptismal"} component={BaptismalHome} />
      <Route path={"/baptismal/history"} component={BaptismalHistory} />
      <Route path={"/baptismal/view/:id"} component={BaptismalView} />
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
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
