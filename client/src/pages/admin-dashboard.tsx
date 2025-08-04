import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, AlertTriangle, Users, Building2, FileText, Settings, Package, CheckCircle } from "lucide-react";
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
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  if (isLoading) {
    return <div className="p-6">Carregando dashboard...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Administrativo</h1>
        <p className="text-gray-600">Visão geral completa da plataforma de franquias</p>
      </div>
      
      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href="/admin/suppliers">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Gerenciar</p>
                  <p className="text-lg font-semibold text-gray-900">Fornecedores</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/stores">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-500 rounded-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Gerenciar</p>
                  <p className="text-lg font-semibold text-gray-900">Lojas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/tickets">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-500 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Gerenciar</p>
                  <p className="text-lg font-semibold text-gray-900">Chamados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/settings">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-500 rounded-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Configurações</p>
                  <p className="text-lg font-semibold text-gray-900">Sistema</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600">Total de Lojas</p>
                <p className="text-xl font-bold text-gray-900">
                  {metrics?.totalStores || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600">Total de Fornecedores</p>
                <p className="text-xl font-bold text-gray-900">
                  {metrics?.totalSuppliers || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600">Chamados Abertos</p>
                <p className="text-xl font-bold text-gray-900">
                  {metrics?.openTickets || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600">Chamados Resolvidos</p>
                <p className="text-xl font-bold text-gray-900">
                  {metrics?.resolvedTickets || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Check className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600">Instalações Concluídas</p>
                <p className="text-xl font-bold text-gray-900">
                  {metrics?.completedInstallations || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600">Kits não Usados</p>
                <p className="text-xl font-bold text-gray-900">
                  {metrics?.unusedKits || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {metrics && <DashboardCharts metrics={metrics} />}

      {/* Unused Kits Details */}
      {metrics?.unusedKitsList && metrics.unusedKitsList.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Detalhes dos Kits não Usados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.unusedKitsList.slice(0, 6).map((kit: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{kit.nome || `Kit ${kit.id}`}</p>
                      <p className="text-sm text-gray-600">ID: {kit.id}</p>
                      {kit.descricao && (
                        <p className="text-sm text-gray-500 mt-1">{kit.descricao}</p>
                      )}
                    </div>
                    <Badge variant="destructive">Não Usado</Badge>
                  </div>
                </div>
              ))}
            </div>
            {metrics.unusedKitsList.length > 6 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  E mais {metrics.unusedKitsList.length - 6} kits não utilizados...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}