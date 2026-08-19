# FixTrack CI — Sprint 1

Fondations du projet FixTrack CI :

- monorepo `backend/` + `frontend/`
- Django REST Framework
- PostgreSQL
- JWT
- modèle `Organization`
- utilisateur personnalisé avec rôles
- endpoint `/api/v1/auth/me/`
- endpoint `/api/v1/organizations/current/`
- permissions métier de base
- seed de démonstration
- frontend React + TypeScript avec login et dashboard

## 1. Backend

```bash
cd backend
python -m venv .venv
```

Windows :

```bash
.venv\Scripts\activate
```

Linux/macOS :

```bash
source .venv/bin/activate
```

Puis :

```bash
pip install -r requirements.txt
copy .env.example .env
python manage.py makemigrations
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

Sous Linux/macOS, remplace `copy` par :

```bash
cp .env.example .env
```

API :

- `POST /api/v1/auth/login/`
- `POST /api/v1/auth/refresh/`
- `GET /api/v1/auth/me/`
- `PATCH /api/v1/auth/me/`
- `GET /api/v1/organizations/current/`
- `GET /api/v1/health/`

Compte de démonstration créé par `seed_demo` :

- `admin@fixtrack.ci`
- `FixTrack123!`

Change ce mot de passe avant tout déploiement réel.

## 2. Frontend

Crée d'abord le projet Vite :

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install axios react-router-dom
```

Ensuite remplace le dossier `src/` par celui fourni dans ce Sprint et copie `.env.example` vers `.env`.

```bash
npm run dev
```

## 3. PostgreSQL avec Docker

Depuis la racine :

```bash
docker compose up -d
```

Puis utilise dans `backend/.env` :

```env
DATABASE_URL=postgresql://fixtrack:fixtrack@localhost:5432/fixtrack
```

## 4. Suite

Sprint 2 :

- sites
- bâtiments
- étages
- salles/zones
- gestion des utilisateurs
- filtrage strict par organisation
