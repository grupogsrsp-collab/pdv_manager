import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { type Supplier } from "@shared/schema";

export default function SupplierAccess() {
  const [, setLocation] = useLocation();
  const [cnpj, setCnpj] = useState("");
  const [searchedCnpj, setSearchedCnpj] = useState("");
  const { toast } = useToast();

  const { data: supplier, isLoading, error } = useQuery<Supplier>({
    queryKey: ["/api/suppliers/cnpj", searchedCnpj],
    enabled: !!searchedCnpj,
  });

  const handleSearch = () => {
    if (cnpj.trim()) {
      setSearchedCnpj(cnpj.trim());
    }
  };

  const handleAccess = () => {
    if (supplier) {
      // Store supplier data for access
      localStorage.setItem("supplier_access", JSON.stringify(supplier));
      setLocation("/supplier");
    }
  };

  const formatCnpj = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    // Apply CNPJ mask: 00.000.000/0000-00
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCnpj(e.target.value);
    setCnpj(formatted);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Acesso do Fornecedor</h1>
            <p className="text-gray-600 mt-2">Digite o CNPJ da sua empresa para acessar</p>
          </div>

          {/* Search Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Buscar Fornecedor por CNPJ</CardTitle>
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
                    onChange={handleCnpjChange}
                    maxLength={18}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch} disabled={isLoading || !cnpj.trim()}>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {error && (
            <Card className="mb-6 border-red-200">
              <CardContent className="pt-6">
                <div className="text-center text-red-600">
                  <p>CNPJ não encontrado no sistema.</p>
                  <p className="text-sm mt-2">Verifique se o CNPJ está correto ou entre em contato com o administrador.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {supplier && (
            <Card className="mb-6 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-700">Fornecedor Encontrado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700">Nome da Empresa</Label>
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
                
                <Button 
                  onClick={handleAccess}
                  className="w-full bg-success hover:bg-success/90 text-white py-3 px-6 rounded-lg font-semibold"
                >
                  Acessar Sistema
                </Button>
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
              <h4 className="font-medium text-gray-900 mb-2">CNPJs para Teste:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• <strong>12.345.678/0001-90</strong> - SuperTech Supplies</p>
                <p>• <strong>98.765.432/0001-10</strong> - ABC Ferramentas</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}