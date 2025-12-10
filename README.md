# Icam Revision Hub (Next.js)

Projet Next.js (App Router) prêt pour Vercel, avec API qui lit les fichiers JSON `/data` et sert les supports PDF statiques depuis `/public/pdfs`.

## Démarrage local
1) Installer les dépendances : `npm install`
2) Lancer le dev server : `npm run dev`
3) Ouvrir http://localhost:3000

## Structure
- `app/page.tsx` : UI quiz + synchronisation PDF.
- `app/api/exams` : API REST pour le manifeste et les questions.
- `data/*.json` : manifeste et questions (côté serveur).
- `public/pdfs` : supports de cours servis en statique.

## Déploiement Vercel
1) Installer Vercel CLI : `npm i -g vercel` (optionnel si vous utilisez le dashboard).
2) `vercel login` puis `vercel link` (ou via le dashboard, importer ce repo).
3) Variables / fichiers : tout est statique, rien à configurer. Les PDF doivent rester dans `public/pdfs`.
4) Build & deploy : `vercel --prod` ou via le bouton Deploy dans le dashboard.

## Notes
- L’API Next lit les JSON en `force-dynamic` pour toujours renvoyer les données du repo.
- Pour ajouter un examen : compléter `data/manifest.json` (id + resources + file) puis ajouter le fichier JSON correspondant dans `data/`.

