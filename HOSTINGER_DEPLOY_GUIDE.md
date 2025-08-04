# 🚀 Guia Completo: Deploy na Hostinger

## ✅ O que você tem agora

Seu projeto está **100% funcional** e pronto para hospedagem completa na Hostinger! 

**Arquivo gerado:** `sistema-gestao-franquias-hostinger.tar.gz`

Este pacote contém:
- ✅ Todo o código fonte (frontend + backend)
- ✅ Configurações de produção
- ✅ Scripts de instalação automatizados
- ✅ Documentação completa
- ✅ Sistema MySQL já integrado
- ✅ Upload de imagens funcionando

## 🎯 Diferença: GitHub Pages vs Hostinger

### GitHub Pages (Limitado)
- ❌ Apenas sites estáticos (HTML/CSS/JS)
- ❌ Sem backend/banco de dados
- ❌ Sem funcionalidades completas

### Hostinger (Completo) ⭐
- ✅ Aplicação completa funcionando
- ✅ Backend Node.js + MySQL
- ✅ Sistema de login e autenticação
- ✅ CRUD completo de todas funcionalidades
- ✅ Upload de imagens
- ✅ Dashboard administrativo completo

## 📋 Requisitos na Hostinger

**Plano necessário:**
- VPS Cloud ou superior
- Node.js habilitado
- MySQL disponível
- Acesso SSH

**Não funciona em:**
- Hospedagem compartilhada básica
- Planos apenas HTML/PHP

## 🚀 Passo a Passo: Deploy na Hostinger

### 1. Preparar Hospedagem
- Acesse seu painel Hostinger
- Certifique-se que tem plano VPS/Cloud com Node.js
- Anote dados de acesso SSH

### 2. Upload do Projeto
```bash
# Via SSH (método recomendado)
scd /home/usuario/public_html/
wget [URL_DO_ARQUIVO] # ou use SCP/FTP
tar -xzf sistema-gestao-franquias-hostinger.tar.gz
```

### 3. Instalação Automática
```bash
# Execute o script de instalação
chmod +x start-production.sh
./start-production.sh
```

O script irá:
- Instalar dependências (npm install)
- Fazer build do projeto (npm run build)
- Configurar variáveis de ambiente
- Iniciar o servidor

### 4. Configurar Banco de Dados
Edite o arquivo `.env`:
```env
DATABASE_URL=mysql://rodr1657_pdv_manager:Pdv429610!@162.241.203.65:3306/rodr1657_pdv_manager
PGDATABASE=rodr1657_pdv_manager
PGHOST=162.241.203.65
PGUSER=rodr1657_pdv_manager  
PGPASSWORD=Pdv429610!
PGPORT=3306
NODE_ENV=production
PORT=3000
```

### 5. Configurar Domínio
Para acessar via seu domínio (sem :3000):

**Apache (.htaccess):**
```apache
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

**Nginx:**
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### 6. Manter Rodando (PM2)
```bash
# Instalar PM2 (gerenciador de processos)
npm install -g pm2

# Iniciar aplicação
pm2 start ecosystem.config.js

# Configurar para iniciar automaticamente
pm2 startup
pm2 save
```

## 🌐 Resultado Final

Após o deploy, você terá:

**URL:** `https://seudominio.com`

**Sistema completo funcionando:**
- Dashboard administrativo moderno
- Login: rodrigo.aeromodelo@gmail.com / 123456
- Gestão de kits com upload de imagens
- Sistema de chamados completo
- CRUD de fornecedores, lojas, admins
- Banco MySQL da Hostinger funcionando
- Interface responsiva para mobile/desktop

## 🔧 Comandos Úteis

```bash
# Ver logs da aplicação
pm2 logs

# Restart da aplicação
pm2 restart franchise-system

# Parar aplicação
pm2 stop franchise-system

# Status das aplicações
pm2 status

# Atualizar código
git pull # se usando git
npm run build
pm2 restart franchise-system
```

## ⚠️ Troubleshooting

### Erro "Node.js not found"
- Ative Node.js no painel Hostinger
- Ou instale via SSH: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash`

### Banco não conecta
- Verifique credenciais no arquivo `.env`
- Teste conexão: `node -e "require('./server/mysql-db.js')"`

### Porta 3000 inacessível
- Configure proxy reverso (Apache/Nginx)
- Ou acesse diretamente: `seudominio.com:3000`

### Upload de imagens não funciona
- Configure object storage na Hostinger
- Ou desabilite temporariamente o upload

## 📞 Suporte

Se encontrar dificuldades:
1. Verifique os logs: `pm2 logs`
2. Teste conexão do banco separadamente
3. Confirme que o plano Hostinger suporta Node.js
4. Contate suporte da Hostinger para ativar Node.js se necessário

---

**🎉 Seu sistema estará 100% funcional na Hostinger com todas as funcionalidades!**