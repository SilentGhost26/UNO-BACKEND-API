# Pruebas end-to-end (E2E)

Las pruebas E2E levantan la API Express real, se conectan a la base configurada en `.env.test` y realizan solicitudes HTTP con `fetch`. Antes de la suite se recrea el esquema con `sequelize.sync({ force: true })`; por ello `DATABASE_NAME` debe ser una base exclusiva de pruebas.

## Ejecución

```bash
npm run test:e2e
```

## Flujos cubiertos

| Flujo | Endpoints | Validaciones principales |
| --- | --- | --- |
| Registro e inicio de sesión | `POST /auth/register`, `POST /auth/login` | Se crea el jugador (201), se devuelve JWT y `playerId` (200), y una contraseña incorrecta devuelve 401. |
| Crear una partida | `POST /games`, `GET /games/:id/status` | Solo usuarios autenticados pueden crearla; queda en `WAITING` y el creador se añade como primer jugador. También se valida un título inválido. |
| Gestionar participantes | `POST` y `DELETE /games/:gameId/players` | Un segundo jugador entra, no puede duplicarse, puede salir, y la salida del propietario elimina la sala que aún espera jugadores. |
| Iniciar y preparar una partida | `PUT /games/:id/start`, `POST /games/:id/cards`, `POST /games/:id/distribute` | Solo el propietario inicia la partida; se crea el mazo, se reparten siete cartas a cada jugador y no se permite repartir dos veces. |
| Jugar un turno | `GET /games/:id/cards/hand`, `GET /games/:id/cards/top-card`, `PUT /games/:id/play`, `PUT /games/:id/draw` | Se busca dinámicamente una carta legal para evitar depender del orden aleatorio del mazo, se comprueba el descarte y se rechaza con 409 a quien juega fuera de turno. |
| Finalizar una partida | `PUT /games/:id/end`, `GET /games/:id/status` | Solo el propietario finaliza, el estado pasa a `FINISHED` y no se puede finalizar por segunda vez. |

## Incidencias corregidas

- El helper de `fetch` sobrescribía `Content-Type` cuando se añadía el header `Authorization`. Express no interpretaba el cuerpo JSON de las peticiones protegidas y los juegos se intentaban crear sin título. Ahora combina ambos headers correctamente.
- Algunas aserciones de efectos secundarios leían una respuesta vieja del middleware de caché. Las consultas E2E que necesitan el estado recién mutado incluyen un parámetro de consulta único.
- La prueba de turno inválido aceptaba tanto 200 como 409; ahora identifica al jugador que no tiene el turno y exige 409.
- `PUT /games/:gameId/play` validaba `cardId` como texto aunque `Card.id` es numérico. Se actualizó el esquema y la documentación Swagger para que coincidan con la respuesta de la API.
