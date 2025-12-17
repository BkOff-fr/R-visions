# Icam Revision Hub - Next.js Edition

Plateforme de révision interactive pour les examens ICAM avec synchronisation PDF et quiz interactifs, construite avec Next.js 14 App Router, TypeScript et Tailwind CSS.

## Fonctionnalités

- ✅ Quiz interactifs à choix multiples
- ✅ Synchronisation en temps réel avec le visualiseur PDF
- ✅ Design responsive (mobile + desktop)
- ✅ Cache ISR pour des performances optimales
- ✅ PWA-ready pour accès hors-ligne
- ✅ Gestion d'erreur complète
- ✅ Headers de sécurité (CSP, XSS protection)
- ✅ Loading skeletons pour meilleure UX

## Stack Technique

- **Framework**: Next.js 14.2.5 (App Router)
- **Langage**: TypeScript 5.4.5
- **Styling**: Tailwind CSS 3.4.11
- **Icônes**: FontAwesome React Components (self-hosted)
- **Déploiement**: Vercel (standalone output)

## Structure du Projet

```
├── app/
│   ├── api/
│   │   ├── exams/
│   │   │   ├── route.ts           # GET /api/exams (manifest)
│   │   │   ├── [id]/route.ts      # GET /api/exams/:id (questions)
│   │   │   └── utils.ts           # Utilitaires partagés
│   │   └── health/
│   │       └── route.ts           # Health check endpoint
│   ├── error.tsx                  # Error boundary global
│   ├── loading.tsx                # Loading UI
│   ├── layout.tsx                 # Layout racine avec métadonnées
│   ├── page.tsx                   # Composant quiz principal
│   ├── icons.ts                   # Configuration FontAwesome
│   └── globals.css                # Styles globaux
├── data/
│   ├── manifest.json              # Catalogue des métadonnées d'examens
│   └── *.json                     # Fichiers de données de questions
├── public/
│   ├── pdfs/                      # PDFs de support de cours
│   └── manifest.json              # Manifest PWA
├── docs/legacy/                   # Version HTML statique archivée
└── Configuration files
    ├── next.config.js             # Configuration Next.js + headers sécurité
    ├── vercel.json                # Configuration Vercel
    ├── tsconfig.json              # Configuration TypeScript
    ├── tailwind.config.js         # Configuration Tailwind
    └── .env.local                 # Variables d'environnement
```

## Démarrage Rapide

### Prérequis

- Node.js 18+ (20.x recommandé)
- npm ou pnpm

### Installation

```bash
npm install
```

### Développement

```bash
npm run dev
# Ouvrir http://localhost:3000
```

### Build Production

```bash
npm run build
npm run start
```

### Variables d'Environnement

Créer `.env.local` :

```env
DATA_DIR=./data          # Répertoire de données personnalisé (optionnel)
NODE_ENV=production      # Mode environnement
```

## Ajouter de Nouveaux Examens

### 1. Créer le fichier JSON de questions

Dans `data/`, créer un fichier avec la structure suivante :

```json
[
  {
    "id": 1,
    "category": "Nom de Catégorie",
    "question": "Texte de la question ?",
    "options": ["Option A", "Option B", "Option C"],
    "correct": [0],
    "explanation": "Texte d'explication",
    "ref": "clé_ressource",
    "page": 42
  }
]
```

### 2. Mettre à jour `data/manifest.json`

```json
{
  "id": "identifiant_unique_examen",
  "subject": "Nom de la Matière",
  "code": "EC07",
  "type": "DS",
  "year": 2024,
  "title": "Titre de l'Examen",
  "description": "Brève description",
  "file": "data/identifiant_examen.json",
  "resources": {
    "clé_ressource": "/pdfs/document.pdf"
  }
}
```

### 3. Ajouter les PDFs

Placer les fichiers PDF dans `public/pdfs/`

## Déploiement sur Vercel

### Via CLI

```bash
npm install -g vercel
vercel --prod
```

### Via Intégration Git (Recommandé)

1. Pusher vers GitHub
2. Connecter le dépôt dans le dashboard Vercel
3. Configurer les paramètres de build :
   - **Framework**: Next.js (auto-détecté)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Déployer

### Vérification Post-Déploiement

```bash
# Vérifier tous les endpoints
curl https://votre-app.vercel.app/
curl https://votre-app.vercel.app/api/exams
curl https://votre-app.vercel.app/api/exams/indus_2024_ds
curl https://votre-app.vercel.app/api/health
```

## Fonctionnalités de Sécurité

- ✅ Content Security Policy headers
- ✅ Protection XSS
- ✅ Prévention du clickjacking
- ✅ Protection contre la traversée de chemin dans les API routes
- ✅ Validation et sanitisation des entrées
- ✅ Error boundaries pour la résilience

## Optimisations Performance

- ✅ ISR avec revalidation 60s pour le catalogue
- ✅ Revalidation 5min pour les données de questions
- ✅ Fonts et icônes self-hosted (tree-shaken)
- ✅ Standalone output pour images Docker minimales
- ✅ Edge caching via Vercel CDN
- ✅ Loading skeletons pour UX améliorée
- ✅ Race condition protection avec AbortController

## API Endpoints

### GET /api/exams

Retourne la liste de tous les examens disponibles.

### GET /api/exams/[id]

Retourne les questions d'un examen spécifique.

### GET /api/health

Vérifie l'état de santé de l'application.

## Notes de Migration

L'application a été migrée d'une version HTML/CSS/JS statique vers Next.js. La version originale est archivée dans `docs/legacy/` pour référence. Améliorations de la migration :

- ✅ Sécurité des types (TypeScript)
- ✅ Performance (cache ISR)
- ✅ Sécurité (headers CSP, validation des entrées)
- ✅ Maintenabilité (architecture en composants)
- ✅ Déploiement (intégration Vercel)

## Licence

Privé - Usage Interne ICAM

---

**Propulsé par Next.js 14 | Déployé sur Vercel**

