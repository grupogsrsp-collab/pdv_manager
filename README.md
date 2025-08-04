# Sistema de Gestão de Franquias

Uma plataforma completa para gerenciamento de lojas de franquias com dashboard administrativo, sistema de chamados, controle de instalações e muito mais.

## 🚀 Demonstração Online

**GitHub Pages:** [Ver Demo Estático](https://seu-usuario.github.io/seu-repositorio/)

> **Nota:** A demo online é uma versão estática que mostra a interface do sistema. Para funcionalidade completa, execute o projeto localmente.

## ✨ Recursos Principais

- **Dashboard Administrativo Completo**
  - Métricas em tempo real
  - Gráficos e relatórios
  - Interface moderna com gradientes

- **Sistema de Gestão de Kits**
  - CRUD completo de kits de instalação
  - Upload de imagens com Object Storage
  - Visualização com preview

- **Controle de Chamados**
  - Sistema de tickets
  - Acompanhamento de status
  - Gestão de prioridades

- **Gestão de Usuários**
  - Fornecedores, lojas e administradores
  - Sistema de autenticação baseado em sessões
  - Controle de acesso por roles

- **Design Responsivo**
  - Interface otimizada para desktop e mobile
  - Componentes modernos com Shadcn/ui
  - Dark mode support

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **Shadcn/ui** para componentes
- **TanStack Query** para gerenciamento de estado
- **React Hook Form** para formulários
- **Wouter** para roteamento

### Backend
- **Node.js** com Express
- **TypeScript** para type safety
- **MySQL** (Hostinger) para banco de dados
- **Object Storage** para upload de arquivos
- **Session-based** authentication

### Deploy e DevOps
- **GitHub Pages** para demo estático
- **GitHub Actions** para CI/CD
- **Replit** para desenvolvimento

## 📋 Pré-requisitos

- Node.js 18+
- MySQL Database
- NPM ou Yarn

## 🚀 Instalação e Execução

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL=mysql://usuario:senha@host:porta/database
PGDATABASE=nome_do_banco
PGHOST=host_do_banco
PGUSER=usuario_do_banco
PGPASSWORD=senha_do_banco
PGPORT=porta_do_banco
```

### 4. Execute o projeto
```bash
npm run dev
```

O sistema estará disponível em `http://localhost:5000`

## 🌐 Deploy no GitHub Pages

### Método 1: Build Manual
```bash
# Tornar o script executável
chmod +x build-github-pages.sh

# Executar build para GitHub Pages
./build-github-pages.sh
```

### Método 2: GitHub Actions (Automático)
1. Commit e push do código para o repositório
2. Vá para Settings > Pages no GitHub
3. Selecione "Deploy from a branch"
4. Escolha "main" branch e pasta "/ (root)"
5. O deploy será automático via GitHub Actions

## 📱 Funcionalidades Implementadas

### ✅ Dashboard Administrativo
- [x] Métricas gerais do sistema
- [x] Gráficos de performance
- [x] Cards informativos
- [x] Layout responsivo com gradientes

### ✅ Gestão de Kits
- [x] Listagem de kits com paginação
- [x] Criar, editar e excluir kits
- [x] Upload de imagens
- [x] Preview de imagens
- [x] Validação de formulários

### ✅ Sistema de Chamados
- [x] Criação de tickets
- [x] Acompanhamento de status
- [x] Filtros e busca
- [x] Interface intuitiva

### ✅ Gestão de Usuários
- [x] CRUD de fornecedores
- [x] CRUD de lojas
- [x] CRUD de administradores
- [x] Sistema de autenticação

### ✅ Recursos Gerais
- [x] Design responsivo completo
- [x] Tema claro/escuro
- [x] Notificações toast
- [x] Validação de formulários
- [x] Loading states
- [x] Error handling

## 🗄️ Estrutura do Banco de Dados

O sistema utiliza MySQL com as seguintes tabelas principais:

- `fornecedores` - Dados dos fornecedores
- `lojas` - Informações das lojas de franquia
- `kits` - Kits de instalação com imagens
- `chamados` - Sistema de tickets/chamados
- `admins` - Usuários administrativos
- `fotos` - Armazenamento de fotos
- `instalacoes` - Controle de instalações

## 🔐 Autenticação

### Credenciais de Teste (Desenvolvimento)
- **Admin:** rodrigo.aeromodelo@gmail.com / 123456

### Sistema de Login
O sistema utiliza autenticação baseada em sessões com controle de acesso por roles:
- **Admin** - Acesso completo ao sistema
- **Fornecedor** - Acesso limitado a funcionalidades específicas
- **Loja** - Dashboard específico para lojas

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run check` - Verificação de tipos TypeScript
- `npm run db:push` - Sincronizar schema com banco
- `./build-github-pages.sh` - Build para GitHub Pages

## 📁 Estrutura do Projeto

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── lib/           # Utilities e configurações
│   │   └── hooks/         # Custom hooks
├── server/                # Backend Express
│   ├── routes.ts          # Rotas da API
│   ├── mysql-storage.ts   # Camada de dados MySQL
│   └── objectStorage.ts   # Configuração object storage
├── shared/                # Tipos e schemas compartilhados
├── .github/workflows/     # GitHub Actions
├── index.html            # Página principal para GitHub Pages
└── build-github-pages.sh # Script de build estático
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma [Issue](https://github.com/seu-usuario/seu-repositorio/issues)
- Entre em contato via email

---

**Desenvolvido com ❤️ usando React + TypeScript + MySQL**