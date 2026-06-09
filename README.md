# todo-nextjs — Todo Client (Next.js 15 + React 19)

React + Next.js (App Router) rakendus, mis kasutab **todo-api-express** backendi
ToDo entiteete. Üks kahest vahetatavast kliendist sama API peal.

> **Part of a 3-repo Todo system** — one backend, two interchangeable front ends:
>
> | Repo | Role |
> |---|---|
> | **todo-api-express** | REST API backend — Express.js + TypeScript, SQLite, JWT |
> | **todo-nextjs** (this repo) | Client — Next.js 15 + React 19 + TypeScript |
> | **todo-vue** | Client — Vue 3 + Pinia |

## Tehnoloogiad

- **Next.js 15** + **React 19** — App Router (`src/app/`), kontekst + reducerid olekuhalduseks (ei prop drilling)
- **TypeScript** — range tüüpimisega
- **Axios** — HTTP klient auto refresh token interceptoriga
- **JWT + Refresh Token** — täielik autentimislahendus
- **Docker** — `next start` standalone konteinris

## Funktsioonid

- JWT + refresh token autentimine (automaatne token uuendus 401 korral)
- Kaitstud marsruudid (`(protected)` route group + AuthContext)
- Registreerimine ja sisselogimine
- Dashboard — kokkuvõttevaade statistikaga
- TodoTasks CRUD + filtreerimine, sorteerimine, otsing, drag-drop järjestus
- TodoCategories CRUD
- TodoPriorities CRUD
- Vormide valideerimine

## Arendus

```bash
npm install
npm run dev
```

## Docker deploy

```bash
# Ehita ja käivita
docker compose -p jsa5 up --build --remove-orphans --detach

# Peata
docker compose -p jsa5 down
```

App on saadaval pordil **84**.
