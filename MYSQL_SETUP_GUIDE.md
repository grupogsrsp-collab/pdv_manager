# Guia de Configuração MySQL - Hostinger

## ✅ Passos Completados

### 1. Instalação do mysql2
```bash
npm install mysql2  # ✅ CONCLUÍDO
```

### 2. Estrutura de Arquivos Criada
- `server/mysql-db.ts` - Configuração de conexão
- `server/mysql-storage.ts` - Implementação dos métodos de banco
- `shared/mysql-schema.ts` - Interfaces e validações
- `server/routes.ts` - Rotas atualizadas para MySQL

### 3. Tabelas MySQL Criadas Automaticamente
O sistema criará estas tabelas quando conectar:

```sql
-- Fornecedores
CREATE TABLE fornecedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome_fornecedor VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  nome_responsavel VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  endereco TEXT NOT NULL,
  valor_orcamento DECIMAL(10,2) NOT NULL
);

-- Lojas
CREATE TABLE lojas (
  codigo_loja VARCHAR(20) PRIMARY KEY,
  nome_loja VARCHAR(255) NOT NULL,
  nome_operador VARCHAR(255) NOT NULL,
  logradouro VARCHAR(255) NOT NULL,
  numero VARCHAR(10) NOT NULL,
  complemento VARCHAR(100),
  bairro VARCHAR(100) NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  uf CHAR(2) NOT NULL,
  cep VARCHAR(10) NOT NULL,
  regiao VARCHAR(50) NOT NULL,
  telefone_loja VARCHAR(20) NOT NULL
);

-- Kits
CREATE TABLE kits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome_peca VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  image VARCHAR(500)
);

-- Chamados
CREATE TABLE chamados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  descricao TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'aberto',
  loja_id VARCHAR(20) NOT NULL,
  fornecedor_id INT NOT NULL,
  data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loja_id) REFERENCES lojas(codigo_loja),
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
);

-- Admins
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL
);

-- Fotos
CREATE TABLE fotos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loja_id VARCHAR(20) NOT NULL,
  foto_url VARCHAR(500) NOT NULL,
  FOREIGN KEY (loja_id) REFERENCES lojas(codigo_loja)
);

-- Instalações
CREATE TABLE instalacoes (
  id VARCHAR(36) PRIMARY KEY,
  loja_id VARCHAR(20) NOT NULL,
  fornecedor_id INT NOT NULL,
  responsible VARCHAR(255) NOT NULL,
  installationDate VARCHAR(20) NOT NULL,
  photos JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loja_id) REFERENCES lojas(codigo_loja),
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
);
```

## 🔧 Próximos Passos para Conectar à Hostinger

### 1. Obter Informações de Conexão Corretas
Na Hostinger, você precisa verificar:
- **Host real**: Não será `localhost` quando conectando externamente
- **Porta**: Normalmente 3306, mas pode ser diferente
- **Permissões**: Se conexões externas são permitidas

### 2. Atualizar Configuração de Conexão
No arquivo `server/mysql-db.ts`, substitua:
```typescript
const dbConfig = {
  host: 'localhost',  // ❌ Mudar para o host da Hostinger
  port: 3306,
  user: 'pdv_manager',
  password: 'Pdv429610!',
  database: 'rodr1657_pdv_manager',
  // Adicionar configurações SSL se necessário
};
```

### 3. Configurações Típicas da Hostinger
```typescript
const dbConfig = {
  host: 'mysql.hostinger.com', // ou IP específico
  port: 3306,
  user: 'pdv_manager',
  password: 'Pdv429610!',
  database: 'rodr1657_pdv_manager',
  ssl: false, // ou true se SSL for obrigatório
  acquireTimeout: 60000,
  timeout: 60000,
};
```

### 4. Testar Conexão
Execute no terminal:
```bash
npm run test-connection
```

## 📋 Estrutura de Dados Implementada

### Fornecedores
- `id`: Identificador único
- `nome_fornecedor`: Nome do fornecedor
- `cnpj`: Número do CNPJ (único)
- `nome_responsavel`: Nome do responsável
- `telefone`: Telefone de contato
- `endereco`: Endereço completo
- `valor_orcamento`: Valor do orçamento

### Lojas
- `codigo_loja`: Código único da loja
- `nome_loja`: Nome da loja
- `nome_operador`: Nome do operador
- `logradouro`: Rua/Avenida
- `numero`: Número do endereço
- `complemento`: Complemento (opcional)
- `bairro`: Bairro
- `cidade`: Cidade
- `uf`: Estado (2 caracteres)
- `cep`: CEP
- `regiao`: Região
- `telefone_loja`: Telefone da loja

## 🔄 Endpoints da API Atualizados

### Fornecedores
- `POST /api/suppliers/auth` - Busca por CNPJ
- `GET /api/suppliers` - Lista todos
- `POST /api/suppliers` - Criar novo

### Lojas
- `POST /api/stores/search` - Busca com filtros
- `GET /api/stores/:codigo` - Busca por código
- `GET /api/stores` - Lista todas
- `POST /api/stores` - Criar nova

### Outras Entidades
- Kits: `/api/kits`
- Chamados: `/api/tickets`
- Admins: `/api/admins`
- Instalações: `/api/installations`

## 🚀 Status do Projeto

✅ **Migração para MySQL completada**
✅ **Estrutura de dados alinhada com seus requisitos**
✅ **Endpoints atualizados**
✅ **Sistema de busca por CNPJ implementado**
✅ **Filtros de loja funcionando**

⚠️ **Pendente**: Configuração da conexão real com Hostinger (depende das credenciais corretas do servidor)

## 📞 Suporte

Se encontrar problemas de conexão, verifique:
1. Host correto da Hostinger (não localhost)
2. Credenciais de acesso
3. Permissões para conexões externas
4. Configurações de firewall/whitelist