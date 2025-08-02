import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Store as StoreType } from "@shared/schema";

export default function StoreAccess() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState({
    cep: "",
    address: "",
    state: "",
    city: "",
    code: "",
  });

  const { data: stores = [], isLoading } = useQuery<StoreType[]>({
    queryKey: ["/api/stores/search", filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim()) {
          searchParams.set(key, value.trim());
        }
      });
      const response = await fetch(`/api/stores/search?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to search stores');
      }
      return response.json();
    },
    enabled: Object.values(filters).some(filter => filter.trim() !== ""),
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectStore = (store: StoreType) => {
    // Store selected store data for access
    localStorage.setItem("store_access", JSON.stringify(store));
    setLocation("/store");
  };

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9);
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    handleFilterChange("cep", formatted);
  };

  const hasFilters = Object.values(filters).some(filter => filter.trim() !== "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Acesso do Lojista</h1>
            <p className="text-gray-600 mt-2">Selecione sua loja para acessar o sistema</p>
          </div>

          {/* Search Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Buscar Loja</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-2">
                    CEP
                  </Label>
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    value={filters.cep}
                    onChange={handleCepChange}
                    maxLength={9}
                  />
                </div>
                <div>
                  <Label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Rua
                  </Label>
                  <Input
                    id="address"
                    placeholder="Ex: Rua das Flores"
                    value={filters.address}
                    onChange={(e) => handleFilterChange("address", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </Label>
                  <Input
                    id="state"
                    placeholder="Ex: SP"
                    value={filters.state}
                    onChange={(e) => handleFilterChange("state", e.target.value.toUpperCase())}
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade
                  </Label>
                  <Input
                    id="city"
                    placeholder="Ex: São Paulo"
                    value={filters.city}
                    onChange={(e) => handleFilterChange("city", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Código da Loja
                  </Label>
                  <Input
                    id="code"
                    placeholder="Ex: 001"
                    value={filters.code}
                    onChange={(e) => handleFilterChange("code", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {hasFilters && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Lojas Encontradas</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Carregando lojas...</div>
                ) : stores.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma loja encontrada com os filtros aplicados.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stores.map((store) => (
                      <div
                        key={store.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{store.name}</h4>
                            <p className="text-sm text-gray-600">{store.address}</p>
                            <p className="text-sm text-gray-500">CEP: {store.cep}</p>
                            <p className="text-sm text-gray-500">
                              {store.city}, {store.state} | Código: {store.code}
                            </p>
                            {store.responsible && (
                              <p className="text-sm text-gray-500">
                                Responsável: {store.responsible}
                              </p>
                            )}
                          </div>
                          <Button
                            onClick={() => handleSelectStore(store)}
                            className="bg-primary hover:bg-blue-700"
                          >
                            Selecionar Loja
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="text-center">
            <Button variant="outline" onClick={() => setLocation("/")}>
              Voltar à Página Inicial
            </Button>
          </div>

          {/* Demo data info */}
          <Card className="mt-6 bg-gray-50">
            <CardContent className="pt-6">
              <h4 className="font-medium text-gray-900 mb-2">Lojas para Teste:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• <strong>Código 001</strong> - Loja A (São Paulo/SP, CEP: 01001-000)</p>
                <p>• <strong>Código 002</strong> - Loja B (Rio de Janeiro/RJ, CEP: 20001-000)</p>
                <p>• <strong>Código 003</strong> - Loja C (Belo Horizonte/MG, CEP: 30001-000)</p>
                <p>• <strong>Código 004</strong> - Loja D (Salvador/BA, CEP: 40001-000)</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}