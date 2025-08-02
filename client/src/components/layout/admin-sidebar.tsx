import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Truck, 
  Store, 
  Headphones, 
  Upload, 
  Settings 
} from "lucide-react";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navigation = [
  { id: "dashboard", name: "Dashboard", icon: BarChart3 },
  { id: "suppliers", name: "Fornecedores", icon: Truck },
  { id: "stores", name: "Lojas", icon: Store },
  { id: "tickets", name: "Chamados", icon: Headphones },
  { id: "upload", name: "Upload Planilha", icon: Upload },
  { id: "settings", name: "Configurações", icon: Settings },
];

export default function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  return (
    <div className="w-64 bg-white shadow-sm h-screen fixed left-0 top-16 overflow-y-auto">
      <nav className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    "w-full flex items-center space-x-3 p-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
