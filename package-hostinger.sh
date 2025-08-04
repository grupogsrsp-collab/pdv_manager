#!/bin/bash

echo "📦 Criando pacote completo para Hostinger..."

# Criar diretório temporário para o pacote
rm -rf hostinger-package
mkdir -p hostinger-package

echo "📁 Copiando arquivos do projeto..."

# Copiar todos os arquivos essenciais
cp -r client/ hostinger-package/
cp -r server/ hostinger-package/
cp -r shared/ hostinger-package/
cp package.json hostinger-package/
cp package-lock.json hostinger-package/
cp tsconfig.json hostinger-package/
cp vite.config.ts hostinger-package/
cp tailwind.config.ts hostinger-package/
cp postcss.config.js hostinger-package/
cp components.json hostinger-package/
cp drizzle.config.ts hostinger-package/

# Copiar arquivos de configuração
cp .gitignore hostinger-package/ 2>/dev/null || :

echo "📝 Criando documentação para Hostinger..."

# Criar arquivo de instruções específico para Hostinger
cat > hostinger-package/HOSTINGER_SETUP.md << 'EOF'
# 🚀 Instalação na Hostinger - Sistema de Gestão de Franquias

## 📋 Pré-requisitos na Hostinger

- **Plano:** VPS ou Cloud Hosting com Node.js
- **Node.js:** Versão 18 ou superior
- **MySQL:** Banco de dados já configurado
- **Acesso SSH:** Para instalação via terminal

## 🔧 Passos de Instalação

### 1. Upload dos Arquivos
- Descompacte o arquivo .zip no diretório do seu domínio
- Exemplo: `/home/usuario/public_html/` ou `/var/www/html/`

### 2. Instalar Dependências
```bash
cd /caminho/para/seu/projeto
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie arquivo `.env` na raiz:
```env
DATABASE_URL=mysql://usuario:senha@localhost:3306/database
PGDATABASE=rodr1657_pdv_manager
PGHOST=162.241.203.65
PGUSER=rodr1657_pdv_manager  
PGPASSWORD=Pdv429610!
PGPORT=3306
NODE_ENV=production
PORT=3000
```

### 4. Build do Projeto
```bash
npm run build
```

### 5. Iniciar Servidor
```bash
npm start
```

### 6. Configurar como Serviço (Opcional)
Para manter o servidor rodando:
```bash
# Instalar PM2
npm install -g pm2

# Iniciar com PM2
pm2 start dist/index.js --name "franchise-system"
pm2 startup
pm2 save
```

## 🌐 Configuração do Domínio

### Apache (.htaccess)
Se usando Apache, crie arquivo `.htaccess`:
```apache
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

### Nginx
Configure proxy reverso:
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 🔍 Verificação

1. **Teste local:** `http://seu-dominio.com:3000`
2. **Com proxy:** `http://seu-dominio.com`
3. **Login admin:** rodrigo.aeromodelo@gmail.com / 123456

## 📞 Suporte

- Verifique logs: `pm2 logs`
- Restart: `pm2 restart franchise-system`
- Status: `pm2 status`

## ⚠️ Importante

- Mantenha as credenciais do banco seguras
- Configure firewall para porta 3000 se necessário
- Faça backup regular do banco de dados
- Monitore logs de erro regularmente
EOF

# Criar arquivo de configuração de produção
cat > hostinger-package/.env.example << 'EOF'
# Configuração do Banco de Dados MySQL
DATABASE_URL=mysql://usuario:senha@host:porta/database
PGDATABASE=nome_do_banco
PGHOST=host_do_banco
PGUSER=usuario_do_banco  
PGPASSWORD=senha_do_banco
PGPORT=3306

# Configuração da Aplicação
NODE_ENV=production
PORT=3000

# Object Storage (se usando)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=seu_bucket_id
PUBLIC_OBJECT_SEARCH_PATHS=caminho_para_assets
PRIVATE_OBJECT_DIR=caminho_para_uploads
EOF

# Criar script de inicialização
cat > hostinger-package/start-production.sh << 'EOF'
#!/bin/bash

echo "🚀 Iniciando Sistema de Gestão de Franquias..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+"
    exit 1
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Verificar se existe arquivo .env
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado. Copie de .env.example e configure."
    exit 1
fi

# Build do projeto
echo "🔨 Fazendo build do projeto..."
npm run build

# Iniciar servidor
echo "🌐 Iniciando servidor..."
NODE_ENV=production npm start
EOF

chmod +x hostinger-package/start-production.sh

# Criar arquivo de configuração do PM2
cat > hostinger-package/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'franchise-system',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

echo "🗜️ Criando arquivo ZIP..."

# Criar arquivo ZIP
cd hostinger-package
zip -r ../sistema-gestao-franquias-hostinger.zip . -x "node_modules/*" "dist/*" ".git/*"
cd ..

echo "✅ Pacote criado com sucesso!"
echo "📁 Arquivo: sistema-gestao-franquias-hostinger.zip"
echo "📝 Documentação: HOSTINGER_SETUP.md (incluída no pacote)"
echo ""
echo "🚀 Próximos passos:"
echo "1. Baixe o arquivo sistema-gestao-franquias-hostinger.zip"
echo "2. Faça upload para sua hospedagem Hostinger"
echo "3. Siga as instruções no arquivo HOSTINGER_SETUP.md"
echo "4. Configure seu domínio e banco de dados"
echo "5. Execute npm install && npm run build && npm start"