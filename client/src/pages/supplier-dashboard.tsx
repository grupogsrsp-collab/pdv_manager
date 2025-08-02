import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Supplier, type Store } from "@shared/schema";

export default function SupplierDashboard() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState({
    cep: "",
    address: "",
    state: "",
    city: "",
    code: "",
  });

  // Get supplier data from localStorage (set during access)
  const supplierData = localStorage.getItem("supplier_access");
  const supplier: Supplier | null = supplierData ? JSON.parse(supplierData) : null;

  // Redirect if no supplier access
  if (!supplier) {
    setLocation("/supplier-access");
    return null;
  }

  const { data: stores = [], isLoading: storesLoading } = useQuery<Store[]>({
    queryKey: ["/api/stores/search", filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim()) {
          searchParams.set(key, value.trim());
        }
      });
      
      // If no filters are applied, get all stores
      const url = searchParams.toString() 
        ? `/api/stores/search?${searchParams.toString()}`
        : '/api/stores';
        
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to search stores');
      }
      return response.json();
    },
    enabled: true,
  });

  const handleLogout = () => {
    localStorage.removeItem("supplier_access");
    setLocation("/supplier-access");
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9);
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    handleFilterChange("cep", formatted);
  };

  const handleSelectStore = (storeId: string) => {
    setLocation(`/supplier/installation/${storeId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Supplier Info Card */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Dados do Fornecedor</CardTitle>
            <Button variant="outline" onClick={handleLogout}>
              Trocar Fornecedor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700">Nome</Label>
              <p className="text-gray-900">{supplier.name}</p>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700">CNPJ</Label>
              <p className="text-gray-900">{supplier.cnpj}</p>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700">Responsável</Label>
              <p className="text-gray-900">{supplier.responsible}</p>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700">Telefone</Label>
              <p className="text-gray-900">{supplier.phone}</p>
            </div>
            <div className="md:col-span-2">
              <Label className="block text-sm font-medium text-gray-700">Endereço</Label>
              <p className="text-gray-900">{supplier.address}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Store Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Loja para Instalação</CardTitle>
        </CardHeader>
        <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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

            {/* Store Results */}
            {storesLoading ? (
              <div className="text-center py-8">Carregando lojas...</div>
            ) : (
              <div className="space-y-4">
                {stores.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma loja encontrada com os filtros aplicados.
                  </div>
                ) : (
                  stores.map((store) => (
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
                            {store.city}, {store.state}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleSelectStore(store.id)}
                          className="bg-primary hover:bg-blue-700"
                        >
                          Selecionar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
