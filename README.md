# trip-sync-mobile

Mobile app for **TripSync** — senior portfolio project. Same B2C flight
booking flow as [trip-sync-platform](https://github.com/kaiqueRoc/trip-sync-platform)
(search → seat → checkout → mocked payment → issuance), built as a real
separate Expo/React Native app talking directly to
[trip-sync-api](https://github.com/kaiqueRoc/trip-sync-api).

- **Expo (React Native) + TypeScript**
- Shares types and validation with the web app via
  [`@trip-sync/contracts`](https://github.com/kaiqueRoc/trip-sync-contracts)
- Always talks to `trip-sync-api` — no local fallback (that's the web
  app's job for standalone demos)
- Its own auth: `trip-sync-api`'s `POST /auth/login` /
  `POST /auth/register` (JWT), persisted with `expo-secure-store`
  (Keychain/Keystore on device)
- Public search and seat selection; login is only required to issue a
  ticket, same as the web checkout
- Payment is fully mocked — the card form is validated for shape and
  discarded, nothing is persisted

## Quick start

```bash
cp .env.example .env.local
npm install
npm start
```

Requires `trip-sync-api` running locally (`npm run dev` in that repo,
default `http://localhost:3333`). On the iOS Simulator, `localhost`
already resolves to the host machine; on a physical device, point
`EXPO_PUBLIC_API_URL` at your machine's LAN IP instead.

## Screens

Busca → Resultados → Seleção de assento → Checkout (passageiro → login
ou cadastro → pagamento mocado) → Confirmação (bilhete) → Minhas
reservas (cancelamento).

## Related repos

| Repo | Description |
|------|-------------|
| [trip-sync-contracts](https://github.com/kaiqueRoc/trip-sync-contracts) | Zod schemas + OpenAPI |
| [trip-sync-api](https://github.com/kaiqueRoc/trip-sync-api) | Backend (Fastify) |
| [trip-sync-ops](https://github.com/kaiqueRoc/trip-sync-ops) | Ops dashboard (React) |
| [trip-sync-platform](https://github.com/kaiqueRoc/trip-sync-platform) | Web app (Next.js) |

## License

MIT © Kaique Rocha
