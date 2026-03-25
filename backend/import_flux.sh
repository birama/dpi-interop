#!/bin/bash

# Script d'import des données Excel vers la base PostgreSQL
# Projet: Questionnaire Interopérabilité SENUM

set -e

echo "=================================================="
echo "🚀 IMPORT DONNÉES FLUX INTEROPÉRABILITÉ"
echo "=================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction d'aide
function print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

function print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

function print_error() {
    echo -e "${RED}❌ $1${NC}"
}

function print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    print_error "Veuillez exécuter ce script depuis le répertoire backend/"
    exit 1
fi

if [ ! -f "prisma/schema.prisma" ]; then
    print_error "Fichier prisma/schema.prisma introuvable"
    exit 1
fi

# Étape 1: Vérifier que les fichiers sont présents
print_step "Étape 1/4: Vérification des fichiers"

if [ ! -f "prisma/flux_data.json" ]; then
    print_error "Fichier prisma/flux_data.json introuvable"
    print_warning "Copiez le fichier flux_data.json dans le répertoire prisma/"
    exit 1
fi

if [ ! -f "prisma/seed_flux_interop.ts" ]; then
    print_error "Fichier prisma/seed_flux_interop.ts introuvable"
    print_warning "Copiez le fichier seed_flux_interop.ts dans le répertoire prisma/"
    exit 1
fi

print_success "Fichiers trouvés"

# Étape 2: Vérifier la connexion à la base
print_step "Étape 2/4: Vérification connexion base de données"

if ! npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    print_error "Impossible de se connecter à la base de données"
    print_warning "Vérifiez que PostgreSQL est démarré et que DATABASE_URL est correcte dans .env"
    exit 1
fi

print_success "Connexion base de données OK"

# Étape 3: Générer le client Prisma
print_step "Étape 3/4: Génération client Prisma"

npx prisma generate

print_success "Client Prisma généré"

# Étape 4: Exécuter le seed
print_step "Étape 4/4: Import des données"

npx tsx prisma/seed_flux_interop.ts

echo ""
echo "=================================================="
echo "✅ IMPORT TERMINÉ AVEC SUCCÈS"
echo "=================================================="
echo ""
echo "📊 Pour visualiser les données:"
echo "   npx prisma studio"
echo ""
echo "🔍 Pour vérifier les données:"
echo "   npx prisma db execute --stdin <<< \"SELECT COUNT(*) FROM institutions;\""
echo "   npx prisma db execute --stdin <<< \"SELECT COUNT(*) FROM flux_existants;\""
echo ""
