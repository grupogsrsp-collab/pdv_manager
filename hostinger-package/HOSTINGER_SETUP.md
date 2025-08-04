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
