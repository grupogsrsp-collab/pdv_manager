#!/bin/bash

echo "🚀 Iniciando build para GitHub Pages..."

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Limpar diretório de build anterior
rm -rf dist

# Criar diretório dist
mkdir -p dist

# Copiar index.html para dist
echo "📄 Copiando index.html..."
cp index.html dist/

# Build do projeto React para páginas estáticas
echo "⚛️ Fazendo build do React..."
npx vite build --config vite.config.github.ts --mode github-pages

# Criar arquivo .nojekyll para GitHub Pages
echo "🔧 Configurando GitHub Pages..."
touch dist/.nojekyll

# Copiar assets necessários
echo "📁 Copiando assets..."
if [ -d "client/public" ]; then
    cp -r client/public/* dist/ 2>/dev/null || :
fi

echo "✅ Build concluído! Arquivos estão em ./dist/"
echo "📝 Para fazer deploy:"
echo "   1. Commit e push dos arquivos"
echo "   2. Ativar GitHub Pages nas configurações do repositório"
echo "   3. Selecionar 'Deploy from a branch' e escolher 'main' branch"
echo "   4. Definir pasta como '/ (root)' ou '/dist' dependendo da configuração"