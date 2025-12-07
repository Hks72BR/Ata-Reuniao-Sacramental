/**
 * Aplicativo de Ata Sacramental
 * Design: Minimalismo Espiritual Contemporâneo
 * Cores: Navy (#1e3a5f) + Dourado (#d4a574) + Branco
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import History from "./pages/History";
import View from "./pages/View";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/history"} component={History} />
      <Route path={"/view"} component={View} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: Design Theme - Minimalismo Espiritual Contemporâneo
// - Light theme with Navy (#1e3a5f) primary and Gold (#d4a574) accents
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
