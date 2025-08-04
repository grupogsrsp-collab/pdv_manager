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
