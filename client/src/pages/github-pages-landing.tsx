import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Users, 
  FileText, 
  BarChart3, 
  Shield, 
  Smartphone,
  Github,
  ExternalLink,
  CheckCircle
} from "lucide-react";

export default function GitHubPagesLanding() {
  const features = [
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Dashboard Administrativo",
      description: "Interface completa para gestão de métricas e análises"
    },
    {
      icon: <Package className="h-6 w-6" />,
      title: "Gestão de Kits",
      description: "Sistema completo com upload de imagens e controle de estoque"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Controle de Usuários",
      description: "Gestão de fornecedores, lojas e administradores"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Sistema de Chamados",
      description: "Tickets de suporte e acompanhamento de instalações"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Autenticação Segura",
      description: "Sistema de login baseado em sessões com controle de acesso"
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "Design Responsivo",
      description: "Interface otimizada para desktop, tablet e mobile"
    }
  ];

  const techStack = [
    "React + TypeScript",
    "Node.js + Express",
    "MySQL Database",
    "Tailwind CSS",
    "Shadcn/ui",
    "Object Storage"
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">SF</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sistema de Gestão de Franquias</h1>
                <p className="text-gray-600">Plataforma completa para gerenciamento de franquias</p>
              </div>
            </div>
            <Badge variant="secondary" className="hidden md:flex">
              Demo Estático
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Gestão de Franquias
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Modernizada
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Sistema completo para gerenciamento de 800+ lojas de franquia com dashboard administrativo, 
            controle de kits, sistema de chamados e muito mais.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Github className="h-5 w-5 mr-2" />
              Ver Código no GitHub
            </Button>
            <Button variant="outline" size="lg">
              <ExternalLink className="h-5 w-5 mr-2" />
              Documentação
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Recursos Principais</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Uma plataforma completa construída com tecnologias modernas para atender 
              todas as necessidades de gestão de franquias.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-blue-600">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Stack Tecnológico</h3>
            <p className="text-gray-600">Construído com as melhores tecnologias modernas</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {techStack.map((tech, index) => (
              <Badge key={index} variant="secondary" className="text-sm py-2 px-4">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Note */}
      <section className="py-20 px-4 bg-amber-50 border-y border-amber-200">
        <div className="container mx-auto">
          <Card className="max-w-4xl mx-auto border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center text-amber-800">
                <CheckCircle className="h-6 w-6 mr-2" />
                Implementação Completa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-amber-700">
                Este sistema está <strong>totalmente implementado e funcional</strong> com todas as funcionalidades desenvolvidas:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-amber-800">✅ Backend Completo:</h4>
                  <ul className="text-sm text-amber-700 space-y-1 ml-4">
                    <li>• API REST com Express.js</li>
                    <li>• Integração MySQL (Hostinger)</li>
                    <li>• Sistema de autenticação</li>
                    <li>• Upload de arquivos configurado</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-amber-800">✅ Frontend Moderno:</h4>
                  <ul className="text-sm text-amber-700 space-y-1 ml-4">
                    <li>• Dashboard administrativo</li>
                    <li>• CRUD completo de todas entidades</li>
                    <li>• Interface responsiva</li>
                    <li>• Sistema de upload de imagens</li>
                  </ul>
                </div>
              </div>
              <div className="bg-amber-100 border border-amber-300 rounded-lg p-4 mt-4">
                <p className="text-sm text-amber-800">
                  <strong>Para executar o sistema completo:</strong> Clone o repositório e execute <code className="bg-amber-200 px-1 rounded">npm run dev</code>. 
                  O sistema requer Node.js, MySQL e as variáveis de ambiente configuradas.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">SF</span>
          </div>
          <p className="text-gray-400 mb-4">
            Sistema de Gestão de Franquias - Desenvolvido com React + TypeScript
          </p>
          <p className="text-sm text-gray-500">
            Esta é uma demonstração estática hospedada no GitHub Pages
          </p>
        </div>
      </footer>
    </div>
  );
}