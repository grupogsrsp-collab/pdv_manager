import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { auth } from "@/lib/auth";
import Login from "@/pages/login";
import SupplierDashboard from "@/pages/supplier-dashboard";
import InstallationChecklist from "@/pages/installation-checklist";
import StoreDashboard from "@/pages/store-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import Header from "@/components/layout/header";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const user = auth.getCurrentUser();
  
  if (!user) {
    window.location.href = "/";
    return null;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.user.role)) {
    return <div className="p-8 text-center">Access denied</div>;
  }
  
  return <>{children}</>;
}

function Router() {
  const user = auth.getCurrentUser();
  
  return (
    <div className="min-h-screen bg-background-alt">
      {user && <Header />}
      <Switch>
        <Route path="/" component={Login} />
        <Route path="/supplier">
          <ProtectedRoute allowedRoles={["supplier"]}>
            <SupplierDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/supplier/installation/:storeId">
          <ProtectedRoute allowedRoles={["supplier"]}>
            <InstallationChecklist />
          </ProtectedRoute>
        </Route>
        <Route path="/store">
          <ProtectedRoute allowedRoles={["store"]}>
            <StoreDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/admin">
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
