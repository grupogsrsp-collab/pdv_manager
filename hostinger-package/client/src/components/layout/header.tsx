import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Store, LogOut } from "lucide-react";

export default function Header() {
  const user = auth.getCurrentUser();
  
  const handleLogout = () => {
    auth.logout();
    window.location.href = "/";
  };

  if (!user) return null;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-primary rounded flex items-center justify-center">
                <Store className="h-4 w-4 text-white" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Franquias Manager</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user.entity?.name || user.user.username}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
