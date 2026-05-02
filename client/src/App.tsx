import DashboardLayout from "@/components/DashboardLayout";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import SeatAvailability from "./pages/SeatAvailability";
import Reports from "./pages/Reports";
import AdminMigration from "./pages/AdminMigration";

function Router() {
  return (
    <Switch>
      <Route path="/" key="home">
        <DashboardLayout>
          <Home />
        </DashboardLayout>
      </Route>
      <Route path="/seat-availability" key="seat-availability">
        <DashboardLayout>
          <SeatAvailability />
        </DashboardLayout>
      </Route>
      <Route path="/reports" key="reports">
        <DashboardLayout>
          <Reports />
        </DashboardLayout>
      </Route>
      <Route path="/admin/migration" key="admin-migration">
        <AdminMigration />
      </Route>
      <Route path="/404" key="not-found" component={NotFound} />
      <Route key="fallback" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
