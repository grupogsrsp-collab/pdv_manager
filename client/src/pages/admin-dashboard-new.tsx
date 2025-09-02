import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  Building2, 
  FileText, 
  Settings, 
  Package, 
  CheckCircle, 
  Plus, 
  ChevronRight, 
  BarChart3, 
  TrendingUp, 
  Activity,
  AlertTriangle,
  Clock,
  Check,
  MapPin
} from "lucide-react";
import DashboardCharts from "@/components/charts/dashboard-charts";
import { Link } from "wouter";

interface DashboardMetrics {
  totalSuppliers: number;
  totalStores: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  completedInstallations: number;
  unusedKits: number;
  monthlyInstallations: number[];
  ticketsByStatus: { open: number; resolved: number };
  unusedKitsList: any[];
}

export default function AdminDashboard() {
  const [showUnusedKitsDetails, setShowUnusedKitsDetails] = useState(false);
  
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6 lg:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Dashboard Administrativo
              </h1>
              <p className="text-gray-600">Visão geral completa da plataforma de franquias</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Activity className="h-4 w-4" />
              <span>Atualizado agora</span>
            </div>
          </div>
        </div>
        
        {/* Management Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 lg:gap-6 mb-8">
          <Link href="/admin/suppliers">
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm border-0 shadow-lg group">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Gerenciar</p>
                  <p className="font-semibold text-gray-900">Fornecedores</p>
                  <ChevronRight className="h-4 w-4 text-gray-400 mt-2 group-hover:text-blue-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/stores">
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm border-0 shadow-lg group">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Gerenciar</p>
                  <p className="font-semibold text-gray-900">Lojas</p>
                  <ChevronRight className="h-4 w-4 text-gray-400 mt-2 group-hover:text-green-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/tickets">
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm border-0 shadow-lg group">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Gerenciar</p>
                  <p className="font-semibold text-gray-900">Chamados</p>
                  <ChevronRight className="h-4 w-4 text-gray-400 mt-2 group-hover:text-orange-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/kits">
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm border-0 shadow-lg group">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Gerenciar</p>
                  <p className="font-semibold text-gray-900">Kits</p>
                  <ChevronRight className="h-4 w-4 text-gray-400 mt-2 group-hover:text-indigo-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/routes">
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm border-0 shadow-lg group">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Gerenciar</p>
                  <p className="font-semibold text-gray-900">Rotas</p>
                  <ChevronRight className="h-4 w-4 text-gray-400 mt-2 group-hover:text-teal-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/settings">
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm border-0 shadow-lg group">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Settings className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Configurar</p>
                  <p className="font-semibold text-gray-900">Sistema</p>
                  <ChevronRight className="h-4 w-4 text-gray-400 mt-2 group-hover:text-purple-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Relatórios Gerenciais */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Relatórios Gerenciais</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Lojas</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics?.totalStores || 0}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +12% este mês
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fornecedores</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics?.totalSuppliers || 0}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +5% este mês
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Chamados Abertos</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics?.openTickets || 0}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-orange-600">
                  <Clock className="h-4 w-4 mr-1" />
                  Requer atenção
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Instalações</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics?.completedInstallations || 0}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <Check className="h-4 w-4 mr-1" />
                  Concluídas
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Kits Não Usados - Resumido */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-indigo-600" />
                  Kits Não Usados
                </div>
                <Dialog open={showUnusedKitsDetails} onOpenChange={setShowUnusedKitsDetails}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="hover:bg-indigo-50"
                      data-testid="button-show-unused-kits-details"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Detalhes dos Kits Não Usados</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-96 overflow-y-auto">
                      {metrics?.unusedKitsList && metrics.unusedKitsList.length > 0 ? (
                        <div className="space-y-3">
                          {metrics.unusedKitsList.map((kit: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                {kit.image_url ? (
                                  <img 
                                    src={kit.image_url} 
                                    alt={kit.nome_peca}
                                    className="w-10 h-10 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <Package className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-900">{kit.nome_peca}</p>
                                  <p className="text-sm text-gray-600">Total disponível</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-red-600">{kit.total_nao_usado}</p>
                                <p className="text-xs text-gray-500">não utilizados</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-8">Nenhum kit não usado encontrado</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {metrics?.unusedKits || 0}
                </div>
                <p className="text-sm text-gray-600">Total não utilizados</p>
                <div className="mt-4 flex items-center justify-center text-sm text-orange-600">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Requer atenção
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Performance */}
          <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Performance Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardCharts 
                monthlyInstallations={metrics?.monthlyInstallations || []}
                ticketsByStatus={metrics?.ticketsByStatus || { open: 0, resolved: 0 }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}