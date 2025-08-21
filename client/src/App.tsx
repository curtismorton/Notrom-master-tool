import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";

// Pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import DevLogin from "@/pages/DevLogin";
import Dashboard from "@/pages/Dashboard";
import LeadCapture from "@/pages/LeadCapture";
import Scheduler from "@/pages/Scheduler";
import NotFound from "@/pages/not-found";

// Admin Pages
import Leads from "@/pages/admin/Leads";
import Projects from "@/pages/admin/Projects";
import Clients from "@/pages/admin/Clients";
import Proposals from "@/pages/admin/Proposals";
import Support from "@/pages/admin/Support";

// Client Portal
import ClientDashboard from "@/pages/portal/ClientDashboard";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/dev" component={DevLogin} />
      <Route path="/start" component={LeadCapture} />
      <Route path="/schedule" component={Scheduler} />
      
      {/* Dashboard - role-based content */}
      <Route path="/dashboard" component={Dashboard} />
      
      {/* Admin routes */}
      <Route path="/admin/leads" component={Leads} />
      <Route path="/admin/projects" component={Projects} />
      <Route path="/admin/clients" component={Clients} />
      <Route path="/admin/proposals" component={Proposals} />
      <Route path="/admin/support" component={Support} />
      
      {/* Client portal */}
      <Route path="/portal/:clientId" component={ClientDashboard} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="dark">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
