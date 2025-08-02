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
  const [cnpj, setCnpj] = useState("");
  const [searchedCnpj, setSearchedCnpj] = useState("");
  const [filters, setFilters] = useState({
    cep: "",
    address: "",
    state: "",
    city: "",
    code: "",
  });

  const { data: supplier, isLoading: supplierLoading } = useQuery<Supplier>({
    queryKey: ["/api/suppliers/cnpj", searchedCnpj],
    enabled: !!searchedCnpj,
  });

  const { data: stores = [], isLoading: storesLoading } = useQuery<Store[]>({
    queryKey: ["/api/stores/search", filters],
    enabled: !!supplier,
  });

  const handleSearch = () => {
    if (cnpj.trim()) {
      setSearchedCnpj(cnpj.trim());
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectStore = (storeId: string) => {
    setLocation(`/supplier/installation/${storeId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Buscar Fornecedor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-2">
                CNPJ
              </Label>
              <Input
                id="cnpj"
                type="text"
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={supplierLoading}>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Info Card */}
      {supplier && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Dados do Fornecedor</CardTitle>
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Store Selection */}
      {supplier && (
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Loja</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <Input
                placeholder="CEP"
                value={filters.cep}
                onChange={(e) => handleFilterChange("cep", e.target.value)}
              />
              <Input
                placeholder="Nome da Rua"
                value={filters.address}
                onChange={(e) => handleFilterChange("address", e.target.value)}
              />
              <Input
                placeholder="Estado"
                value={filters.state}
                onChange={(e) => handleFilterChange("state", e.target.value)}
              />
              <Input
                placeholder="Cidade"
                value={filters.city}
                onChange={(e) => handleFilterChange("city", e.target.value)}
              />
              <Input
                placeholder="Código da Loja"
                value={filters.code}
                onChange={(e) => handleFilterChange("code", e.target.value)}
              />
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
      )}
    </div>
  );
}
