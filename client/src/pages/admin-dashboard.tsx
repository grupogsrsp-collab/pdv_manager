import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminSidebar from "@/components/layout/admin-sidebar";
import DashboardCharts from "@/components/charts/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, AlertTriangle, DollarSign } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Ticket } from "@shared/schema";

interface DashboardMetrics {
  completedInstallations: number;
  pendingInstallations: number;
  openTickets: number;
  totalBudget: number;
  monthlyInstallations: number[];
  ticketsByStatus: { open: number; resolved: number };
}

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [ticketFilters, setTicketFilters] = useState({ type: "", status: "" });
  const { toast } = useToast();

  const { data: metrics } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: tickets = [] } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets", ticketFilters],
  });

  const resolveTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      return apiRequest("PUT", `/api/tickets/${ticketId}/resolve`, {
        resolvedBy: "Administrador",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Sucesso",
        description: "Chamado resolvido com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao resolver chamado",
        variant: "destructive",
      });
    },
  });

  const handleResolveTicket = (ticketId: string) => {
    resolveTicketMutation.mutate(ticketId);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const renderDashboardSection = () => (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard de Métricas</h1>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-success rounded-lg">
                <Check className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Instalações Finalizadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics?.completedInstallations || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-warning rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Instalações Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics?.pendingInstallations || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-error rounded-lg">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Chamados Abertos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics?.openTickets || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Orçamentos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics?.totalBudget || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {metrics && <DashboardCharts metrics={metrics} />}
    </div>
  );

  const renderTicketsSection = () => (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Chamados</h1>
        <div className="flex space-x-4">
          <Select
            value={ticketFilters.type}
            onValueChange={(value) => setTicketFilters(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="supplier">Fornecedor</SelectItem>
              <SelectItem value="store">Lojista</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={ticketFilters.status}
            onValueChange={(value) => setTicketFilters(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todos Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos Status</SelectItem>
              <SelectItem value="open">Aberto</SelectItem>
              <SelectItem value="resolved">Resolvido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Nenhum chamado encontrado
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">#{ticket.id.slice(-6)}</TableCell>
                    <TableCell className="capitalize">{ticket.type}</TableCell>
                    <TableCell>{ticket.entityName}</TableCell>
                    <TableCell className="max-w-xs truncate">{ticket.description}</TableCell>
                    <TableCell>
                      <Badge
                        variant={ticket.status === "open" ? "destructive" : "default"}
                        className={ticket.status === "open" ? "bg-warning" : "bg-success"}
                      >
                        {ticket.status === "open" ? "Aberto" : "Resolvido"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(ticket.createdAt!).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {ticket.status === "open" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-success hover:text-success/80"
                          onClick={() => handleResolveTicket(ticket.id)}
                          disabled={resolveTicketMutation.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Resolver
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderUploadSection = () => (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Upload de Planilha</h1>
      
      <Card>
        <CardContent className="p-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary transition duration-200">
            <div className="text-4xl text-gray-400 mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload de Dados das Lojas</h3>
            <p className="text-gray-600 mb-4">Arraste e solte ou clique para selecionar uma planilha Excel</p>
            <Button className="bg-primary hover:bg-blue-700">
              Selecionar Arquivo
            </Button>
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-2">Formato da Planilha:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Coluna A: Nome da Loja</li>
              <li>• Coluna B: Código da Loja</li>
              <li>• Coluna C: Endereço</li>
              <li>• Coluna D: Responsável</li>
              <li>• Coluna E: CNPJ</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettingsSection = () => (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Configurações da Plataforma</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Logo Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Logo da Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-xl">🏪</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Logo atual</p>
                  <Button variant="link" className="text-primary p-0 h-auto">
                    Alterar logo
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Paleta de Cores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Cor Primária</span>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded border" />
                  <input
                    type="color"
                    defaultValue="#1976D2"
                    className="w-8 h-8 rounded border cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Cor Secundária</span>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-700 rounded border" />
                  <input
                    type="color"
                    defaultValue="#424242"
                    className="w-8 h-8 rounded border cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboardSection();
      case "tickets":
        return renderTicketsSection();
      case "upload":
        return renderUploadSection();
      case "settings":
        return renderSettingsSection();
      default:
        return renderDashboardSection();
    }
  };

  return (
    <div className="flex">
      <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex-1 ml-64 p-8">
        {renderContent()}
      </div>
    </div>
  );
}
