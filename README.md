# PlayStation Store · lab de microservicios con Docker

Lab guiado de la **Clase 22** (Programación Web · URL). Levantamos una tienda de juegos hecha de
**4 microservicios** con **Docker Compose**, y la vemos en **Docker Desktop**.

## Qué hay adentro
```
starter-playstation-store/
├── gateway/        la ÚNICA puerta (:8080) + la mini web. Enruta y orquesta.
├── catalogo/       microservicio: lista de juegos a la venta (datos en memoria)
├── biblioteca/     microservicio: los juegos que ya compraste (datos en memoria)
├── billetera/      microservicio NUEVO: el saldo del usuario (cobrar / recargar)
├── compose.yml             solución (el compose completo que funciona)
└── compose.ejercicio.yml   esqueleto con TODO para llenar en clase
```
La app ya viene **prefabricada**: en el lab no se programa — se escribe el `compose.yml` y se
construyen/levantan las imágenes con Docker. Todo es Node + Express, sin base de datos (datos en
memoria) para que el foco sea Docker.

## Arquitectura
```
navegador  →  gateway (:8080)  →  catalogo  (interno :4001)
                               →  biblioteca (interno :4002)
                               →  billetera  (interno :4003)
```
Solo el **gateway** se expone al exterior. Los servicios se encuentran entre sí por su **nombre**
(`catalogo`, `biblioteca`): Docker Compose crea una red interna y resuelve esos nombres solo.
Al **Comprar**, el gateway le pide el juego al `catalogo`, le cobra el precio a la `billetera`
y lo manda a la `biblioteca` → tres microservicios colaborando por la red. Si el saldo no alcanza,
la billetera responde `402` y la compra se corta (el juego no llega a la biblioteca).

## Servicio billetera (nuevo)
| Método | Ruta        | Body            | Qué hace                                   |
|--------|-------------|-----------------|--------------------------------------------|
| GET    | `/saldo`    | —               | devuelve `{ saldo }`                       |
| POST   | `/cobrar`   | `{ "monto": n }`| descuenta; `402` si el saldo no alcanza    |
| POST   | `/recargar` | `{ "monto": n }`| suma al saldo                              |

El saldo inicial se configura con `SALDO_INICIAL` en el `compose.yml` (por defecto `150`).
En la web, el saldo aparece arriba a la derecha con un botón **＋ $50** para recargar.

## Pasos del lab (Docker Desktop ya instalado)
1. **Verificar Docker**: abrí Docker Desktop (ballena en verde) y corré `docker run hello-world`.
2. **Ciclo de vida** (en Docker Desktop, botones Start/Stop/Delete) ↔ CLI: `docker ps`, `docker stop`, `docker rm`.
3. **Recorré** las 3 carpetas de servicios y sus `Dockerfile`.
4. **Escribí el `compose.yml`** (usá `compose.ejercicio.yml`, llená los `TODO`).
5. **Levantá todo**:
   ```bash
   docker compose up --build
   ```
6. En **Docker Desktop → Containers**: vas a ver el stack `starter-playstation-store` con los 3
   contenedores en verde.
7. **Probalo**: abrí http://localhost:8080 → catálogo → *Comprar* → aparece en *Mi biblioteca*.
8. **Inspeccioná** en Docker Desktop: Logs de cada contenedor, pestaña Images, o abrí una terminal
   dentro de un contenedor.
9. **Escalá / apagá**:
   ```bash
   docker compose up --scale catalogo=2   # opcional
   docker compose down
   ```

## Troubleshooting
- **Puerto 8080 ocupado**: cambiá el mapeo a `"8081:8080"` en el `compose.yml` y abrí `:8081`.
- **El gateway responde pero el catálogo no carga**: revisá que las URLs del `environment` usen los
  **nombres de servicio** (`http://catalogo:4001`), no `localhost`.
- **Cambié código y no se refleja**: volvé a correr con `--build` para reconstruir la imagen.

## Nota
Verificado con Node 26 (`node --check` de los 3 servicios) y el `compose.yml` parsea como YAML válido.
El `docker compose up` real **no se corrió en la máquina del curso** (no hay Docker ahí) — probalo
vos antes de clase.
