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
import { AdminDataFix } from "./pages/AdminDataFix";
import { AdminSeatMaster } from "./pages/AdminSeatMaster";
import Students from "./pages/Students";
import { Users } from "./pages/Users";

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
      <Route path="/students" key="students">
        <DashboardLayout>
          <Students />
        </DashboardLayout>
      </Route>
      <Route path="/users" key="users">
        <DashboardLayout>
          <Users />
        </DashboardLayout>
      </Route>
      <Route path="/admin/migration" key="admin-migration">
        <AdminMigration />
      </Route>
      <Route path="/admin/data-fix" key="admin-data-fix">
        <DashboardLayout>
          <AdminDataFix />
        </DashboardLayout>
      </Route>
      <Route path="/admin/seat-master" key="admin-seat-master">
        <DashboardLayout>
          <AdminSeatMaster />
        </DashboardLayout>
      </Route>
      <Route path="/404" key="not-found" component={NotFound} />
      <Route key="fallback" component={NotFound} />
    </Switch>
  );
}

function App() {
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
  const defaultTheme = storedTheme ?? (systemPrefersDark ? "dark" : "light");

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme={defaultTheme} switchable={true}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
