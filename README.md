# kakekalender

De som må ha med kake.

En enkel kalender for å holde oversikt over hvem som skal ha med kake. Alle kan se kalenderen, men kun admin (Fernande) kan legge til, redigere eller slette oppføringer.

## Kjøre med Docker (anbefalt)

### Forutsetninger

- [Docker](https://docs.docker.com/get-docker/) med Docker Compose (følger med Docker Desktop)

### 1. Konfigurasjon

Kopier `.env.example` til `.env`:

```bash
cp .env.example .env
```

Åpne `.env` og sett:

- `ADMIN_PASSWORD` - passordet Fernande logger inn med
- `SESSION_SECRET` - en lang, tilfeldig streng. Generer en med:

```bash
openssl rand -hex 32
```

### 2. Bygg og start containeren

```bash
docker compose up --build -d
```

`-d` starter containeren i bakgrunnen. Dette bygger imaget og starter containeren, koblet til port `3000`.

### 3. Åpne kalenderen

Gå til [http://localhost:3000](http://localhost:3000) i nettleseren.

### Se logger

```bash
docker compose logs -f
```

### Stoppe containeren

```bash
docker compose down
```

Dette fjerner ikke dataene - de ligger trygt i Docker-volumet `kakekalender-data` til neste `docker compose up`.

### Oppdatere til en ny versjon

Etter å ha hentet ny kode (`git pull` e.l.):

```bash
docker compose up --build -d
```

Compose bygger imaget på nytt og bytter ut den kjørende containeren. Dataene i volumet påvirkes ikke.

### Sikkerhetskopi og gjenoppretting av data

Alle oppføringer lagres i én fil (`entries.json`) i Docker-volumet `kakekalender-data`. Ta backup med:

```bash
docker run --rm -v kakekalender_kakekalender-data:/data -v "$(pwd)":/backup alpine \
  cp /data/entries.json /backup/entries-backup.json
```

Gjenopprett tilsvarende ved å kopiere filen tilbake til volumet.

### Kjøre uten Docker Compose

Du kan også bygge og kjøre imaget direkte med `docker build` / `docker run`, uten Compose:

```bash
docker build -t kakekalender .

docker run -d \
  --name kakekalender \
  -p 3000:3000 \
  -e ADMIN_USERNAME=fernande \
  -e ADMIN_PASSWORD=hemmelig \
  -e SESSION_SECRET=en-lang-tilfeldig-streng \
  -v kakekalender-data:/app/data \
  kakekalender
```

### Kjøre på en server

Fremgangsmåten over fungerer likt på en server/VPS: klon repoet, sett opp `.env`, og kjør `docker compose up --build -d`. Sett `PORT`/portmappingen i `docker-compose.yml` om du vil eksponere en annen port, og legg gjerne en reverse proxy (f.eks. Caddy eller nginx) foran for HTTPS.

## Kjøre uten Docker

```bash
npm install
ADMIN_USERNAME=fernande ADMIN_PASSWORD=hemmelig SESSION_SECRET=en-lang-tilfeldig-streng npm start
```

## Miljøvariabler

| Variabel | Beskrivelse | Påkrevd |
| --- | --- | --- |
| `ADMIN_USERNAME` | Brukernavn for admin (standard: `fernande`) | Nei |
| `ADMIN_PASSWORD` | Passord for admin-innlogging | Ja |
| `SESSION_SECRET` | Hemmelig nøkkel for signering av innloggingsøkter | Ja (i produksjon) |
| `PORT` | Port serveren kjører på (standard: `3000`) | Nei |
| `DATA_DIR` | Mappe for datalagring (standard: `./data`) | Nei |
