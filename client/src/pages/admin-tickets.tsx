import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Search, CheckCircle, Clock, AlertTriangle, ArrowLeft, Phone, MapPin, Calendar, User, X, Info, Store } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { type Ticket } from "@shared/mysql-schema";

export default function AdminTickets() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { toast } = useToast();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["/api/tickets"],
  });

  const resolveTicketMutation = useMutation({
    mutationFn: (ticketId: number) => 
      apiRequest("PATCH", `/api/tickets/${ticketId}/resolve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ 
        title: "✅ Chamado encerrado com sucesso!", 
        description: "O chamado foi marcado como encerrado."
      });
      setShowResolveModal(false);
      setSelectedTicket(null);
    },
    onError: () => {
      toast({ 
        title: "Erro ao resolver chamado", 
        description: "Tente novamente em alguns instantes.",
        variant: "destructive" 
      });
    },
  });

  const filteredTickets = (tickets || []).filter((ticket: Ticket) => {
    const matchesSearch = 
      ticket.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.nome_fornecedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.codigo_loja?.includes(searchTerm) ||
      ticket.nome_loja?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.cidade?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      ticket.status.toLowerCase() === statusFilter || 
      (statusFilter === "aberto" && (ticket.status === "aberto" || ticket.status === "Aberto")) ||
      (statusFilter === "encerrado" && (ticket.status === "resolvido" || ticket.status === "Resolvido" || ticket.status === "encerrado"));
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Função para agrupar tickets por loja (mesma lógica do admin-route-track)
  const groupTicketsByStore = (tickets: Ticket[]) => {
    const grouped: Record<string, Ticket[]> = {};
    tickets.forEach(ticket => {
      // Determinar a chave para agrupar baseado no código da loja
      let storeKey = ticket.codigo_loja;
      
      // Se não tiver código da loja, tentar usar loja_id como fallback
      if (!storeKey && ticket.loja_id) {
        storeKey = ticket.loja_id.toString();
      }
      
      if (storeKey) {
        if (!grouped[storeKey]) {
          grouped[storeKey] = [];
        }
        grouped[storeKey].push(ticket);
      }
    });
    return grouped;
  };

  const groupedTickets = groupTicketsByStore(filteredTickets);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleResolveClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowResolveModal(true);
  };

  const handleDetailsClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowDetailsModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando chamados...</p>
        </div>
      </div>
    );
  }

  // Contadores de status
  const statusCounts = {
    total: (tickets || []).length,
    aberto: (tickets || []).filter((t: Ticket) => t.status === "aberto" || t.status === "Aberto").length,
    resolvido: (tickets || []).filter((t: Ticket) => t.status === "resolvido" || t.status === "Resolvido").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Painel
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Chamados</h1>
            <p className="text-gray-500 text-sm mt-1">Acompanhe e resolva os chamados de fornecedores e lojas</p>
          </div>
        </div>

        {/* Estatísticas Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total de Chamados</p>
                  <p className="text-3xl font-bold text-gray-900">{statusCounts.total}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Chamados Abertos</p>
                  <p className="text-3xl font-bold text-gray-900">{statusCounts.aberto}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <Clock className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Chamados Resolvidos</p>
                  <p className="text-3xl font-bold text-gray-900">{statusCounts.resolvido}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por descrição, fornecedor, loja ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
              data-testid="input-search-tickets"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-white" data-testid="select-status-filter">
              <SelectValue placeholder="Todos os Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="aberto">Abertos</SelectItem>
              <SelectItem value="encerrado">Encerrados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de Chamados Agrupados por Loja */}
        <div className="space-y-6">
          {Object.keys(groupedTickets).length > 0 ? (
            Object.entries(groupedTickets).map(([storeId, storeTickets]) => {
              // Encontrar o ticket com informações mais completas da loja
              const ticketWithStoreInfo = storeTickets.find(t => t.nome_loja && t.codigo_loja) || storeTickets[0];
              const storeName = ticketWithStoreInfo?.nome_loja || '';
              const storeCode = ticketWithStoreInfo?.codigo_loja || storeId;
              const storeAddress = ticketWithStoreInfo?.logradouro && ticketWithStoreInfo?.cidade ? 
                `${ticketWithStoreInfo.logradouro} ${ticketWithStoreInfo.numero || ''}, ${ticketWithStoreInfo.bairro || ''} - ${ticketWithStoreInfo.cidade} - ${ticketWithStoreInfo.uf}` : '';
              
              // Separar chamados por tipo
              const instaladorTickets = storeTickets.filter(ticket => ticket.tipo_chamado === 'fornecedor');
              const lojistaTickets = storeTickets.filter(ticket => ticket.tipo_chamado === 'loja');
              
              return (
                <Card key={storeId} className="border shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <Store className="h-5 w-5 text-gray-600" />
                      <span>Loja {storeCode}</span>
                      {storeName && <span className="text-gray-600 font-normal">- {storeName}</span>}
                    </div>
                    {storeAddress && (
                      <p className="text-sm text-gray-600 mt-1 ml-7">
                        {storeAddress}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 px-6 pb-6 space-y-4">
                    {/* Chamados do Instalador */}
                    {instaladorTickets.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Chamados do Instalador ({instaladorTickets.length})
                        </h4>
                        <div className="space-y-3 ml-6">
                          {instaladorTickets.map((ticket) => (
                            <div key={ticket.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium text-gray-700">Instalador {ticket.instalador}</span>
                                    <span className="text-xs text-gray-500">
                                      Telefone: {ticket.telefone_instalador || 'Não informado'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-2">{ticket.descricao}</p>
                                  <p className="text-xs text-gray-500">
                                    <Calendar className="h-3 w-3 inline mr-1" />
                                    {ticket.data_abertura && formatDate(String(ticket.data_abertura))}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Badge 
                                    variant={ticket.status === 'aberto' || ticket.status === 'Aberto' ? 'default' : 'secondary'}
                                    className={(ticket.status === 'aberto' || ticket.status === 'Aberto') ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
                                  >
                                    {(ticket.status === 'aberto' || ticket.status === 'Aberto') ? 'Aberto' : 'Resolvido'}
                                  </Badge>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDetailsClick(ticket)}
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                  >
                                    <Info className="h-3 w-3 mr-1" />
                                    Detalhes
                                  </Button>
                                  {(ticket.status === 'aberto' || ticket.status === 'Aberto') && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleResolveClick(ticket)}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Encerrar
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Chamados do Lojista */}
                    {lojistaTickets.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          Chamados do Lojista ({lojistaTickets.length})
                        </h4>
                        <div className="space-y-3 ml-6">
                          {lojistaTickets.map((ticket) => (
                            <div key={ticket.id} className="p-4 border border-gray-200 rounded-lg bg-blue-50">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium text-gray-700">Lojista</span>
                                    <span className="text-xs text-gray-500">
                                      Telefone: {ticket.telefone_loja || 'Não informado'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-2">{ticket.descricao}</p>
                                  <p className="text-xs text-gray-500">
                                    <Calendar className="h-3 w-3 inline mr-1" />
                                    {ticket.data_abertura && formatDate(String(ticket.data_abertura))}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Badge 
                                    variant={ticket.status === 'aberto' || ticket.status === 'Aberto' ? 'default' : 'secondary'}
                                    className={(ticket.status === 'aberto' || ticket.status === 'Aberto') ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
                                  >
                                    {(ticket.status === 'aberto' || ticket.status === 'Aberto') ? 'Aberto' : 'Resolvido'}
                                  </Badge>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDetailsClick(ticket)}
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                  >
                                    <Info className="h-3 w-3 mr-1" />
                                    Detalhes
                                  </Button>
                                  {(ticket.status === 'aberto' || ticket.status === 'Aberto') && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleResolveClick(ticket)}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Encerrar
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Nenhum chamado encontrado</p>
                  <p className="text-gray-400 text-sm">Tente ajustar os filtros de busca</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modal de Detalhes */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                Detalhes do Chamado
              </DialogTitle>
            </DialogHeader>
            
            {/* Layout Horizontal Compacto */}
            <div className="py-4">
              {/* Seção Superior - Informações Básicas */}
              <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Tipo</p>
                  <p className="text-gray-900 font-medium">
                    {selectedTicket?.tipo_chamado === 'fornecedor' ? 'Fornecedor' : 'Lojista'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Status</p>
                  <Badge 
                    variant={(selectedTicket?.status === 'aberto' || selectedTicket?.status === 'Aberto') ? 'default' : 'secondary'}
                    className={(selectedTicket?.status === 'aberto' || selectedTicket?.status === 'Aberto') ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
                  >
                    {(selectedTicket?.status === 'aberto' || selectedTicket?.status === 'Aberto') ? 'Aberto' : 'Resolvido'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Código da Loja</p>
                  <p className="text-gray-900 font-medium">{selectedTicket?.codigo_loja || selectedTicket?.loja_id || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Data de Abertura</p>
                  <p className="text-gray-900 font-medium">
                    {selectedTicket?.data_abertura && formatDate(String(selectedTicket.data_abertura))}
                  </p>
                </div>
              </div>

              {/* Grid Principal - 2 Colunas */}
              <div className="grid grid-cols-2 gap-6">
                {/* Coluna Esquerda - Informações do Responsável */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                    {selectedTicket?.tipo_chamado === 'fornecedor' ? 'Dados do Fornecedor' : 'Dados da Loja'}
                  </h3>
                  
                  {selectedTicket?.tipo_chamado === 'fornecedor' ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Nome do Fornecedor</p>
                        <p className="text-gray-900">{selectedTicket?.nome_fornecedor || 'Não informado'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Nome do Responsável</p>
                        <p className="text-gray-900">{selectedTicket?.nome_responsavel || 'Não informado'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Telefone</p>
                          <p className="text-gray-900">{selectedTicket?.telefone_fornecedor || 'Não informado'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Estado</p>
                          <p className="text-gray-900">{selectedTicket?.estado_fornecedor || 'Não informado'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">E-mail</p>
                        <p className="text-gray-900">{selectedTicket?.email_fornecedor || 'Não informado'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Endereço Completo</p>
                        <p className="text-gray-900">{selectedTicket?.endereco_fornecedor || 'Não informado'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Nome da Loja</p>
                        <p className="text-gray-900">{selectedTicket?.nome_loja || selectedTicket?.nome_fornecedor || 'Não informado'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Nome do Operador</p>
                        <p className="text-gray-900">{selectedTicket?.nome_operador || selectedTicket?.nome_responsavel || 'Não informado'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Telefone</p>
                          <p className="text-gray-900">{selectedTicket?.telefone_loja || selectedTicket?.telefone_fornecedor || 'Não informado'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Estado</p>
                          <p className="text-gray-900">{selectedTicket?.uf || selectedTicket?.estado_fornecedor || 'Não informado'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Região</p>
                        <p className="text-gray-900">{selectedTicket?.regiao || 'Não informado'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Endereço Completo</p>
                        <p className="text-gray-900">
                          {selectedTicket?.endereco_fornecedor || 
                           [
                             selectedTicket?.logradouro,
                             selectedTicket?.numero,
                             selectedTicket?.complemento,
                             selectedTicket?.bairro,
                             selectedTicket?.cidade,
                             selectedTicket?.uf,
                             selectedTicket?.cep
                           ].filter(Boolean).join(', ') || 'Não informado'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Coluna Direita - Informações do Chamado */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Descrição do Chamado</h3>
                  <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                    <p className="text-gray-900 leading-relaxed">{selectedTicket?.descricao}</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
                className="px-6"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmação para Encerrar Chamado */}
        <Dialog open={showResolveModal} onOpenChange={setShowResolveModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Encerrar Chamado
              </DialogTitle>
              <DialogDescription className="pt-4">
                Tem certeza que deseja encerrar este chamado?
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 mb-2">{selectedTicket?.descricao}</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    {selectedTicket?.nome_fornecedor && (
                      <p>Fornecedor: {selectedTicket.nome_fornecedor}</p>
                    )}
                    {selectedTicket?.codigo_loja && (
                      <p>Loja: {selectedTicket.codigo_loja} - {selectedTicket.nome_loja}</p>
                    )}
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowResolveModal(false)}
                disabled={resolveTicketMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => selectedTicket && resolveTicketMutation.mutate(selectedTicket.id)}
                disabled={resolveTicketMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {resolveTicketMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Encerrando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Encerrar Chamado
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}