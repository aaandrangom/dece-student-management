# CLAUDE.md

SIGDECE: app de escritorio (Wails v2) para el Departamento de Consejería Estudiantil (DECE) de un colegio en Ecuador. Backend Go + frontend React, BD SQLite local. Todo el dominio, UI y mensajes de error están en **español**.

## Stack
- Go 1.24, módulo `dece`. Wails v2.11, GORM + `glebarez/sqlite` (sin CGO), bcrypt, `maroto/v2` (PDF), `excelize/v2` (Excel), `minio/selfupdate` (auto-update).
- Frontend: React 18 + Vite 7 + Tailwind v4 (`@tailwindcss/vite`), `react-router-dom` (HashRouter), `lucide-react` (iconos), `sonner` (toasts), `sweetalert2` (confirmaciones, ver `frontend/src/utils/alerts.js`), `driver.js` (tutoriales).
- JS puro (`.jsx`), sin TypeScript, sin tests, sin linter configurado.

## Comandos
- `wails dev` — desarrollo con hot reload (regenera bindings `frontend/wailsjs/`).
- `wails build` — binario en `build/bin/SIGDECE.exe`.
- `wails generate module` — regenera solo los bindings JS tras cambiar métodos de servicios.
- `go build ./...` / `go vet ./...` — verificación rápida del backend.
- `cd frontend && npm run build` — verificación rápida del frontend.

## Arquitectura (backend)
```
main.go          wiring: crea servicios con *gorm.DB y los registra en Bind[] de Wails
app.go           struct App: startup() inyecta ctx a servicios que usan runtime (diálogos), arranca scheduler de notificaciones y sync Telegram
updater.go       CurrentVersion + CheckUpdate/DoUpdate/RestartApp (version.json en Cloudflare R2)
internal/
  config/        LoadConfig(): .env (dev) o vars inyectadas por -ldflags (Injected*) en prod
  domain/<mod>/  modelos GORM (structs en español: Estudiante, Matricula, PeriodoLectivo...)
  domain/common/ JSONMap[T] genérico para columnas JSON
  application/
    dtos/<mod>/      DTOs entrada/salida (tags json snake_case)
    services/<mod>/  lógica de negocio; cada método público = endpoint expuesto al frontend
    helpers/security/
  infrastructure/database/
    db.go        InitDB: SQLite en os.UserConfigDir()/SigDECE/sigdece.db, PRAGMA foreign_keys, AutoMigrate
    seeder.go    admin (desde config), niveles, materias, configuración
    v2.sql       esquema SQL de referencia (no se ejecuta; la fuente de verdad es AutoMigrate)
```
Módulos: security (auth, usuarios, institución, config seguridad), academic (periodos, niveles, materias), faculty (docentes, cursos, distributivo), student, enrollment (matrícula, retiros), tracking (llamados de atención, casos sensibles), management (convocatorias, capacitaciones, plantillas), notifications, reports, dashboard, search, sync (Telegram), system (mantenimiento/backup).

### Patrón de servicio
```go
type XService struct { db *gorm.DB; ctx context.Context /*si usa runtime*/ }
func NewXService(db *gorm.DB) *XService
func (s *XService) CrearX(input dto.CrearXDTO) error            // validar, devolver errors.New/fmt.Errorf en español
func (s *XService) ListarX() ([]dto.XResponseDTO, error)        // mapear modelo -> DTO
func (s *XService) SetContext(ctx context.Context)              // solo si usa diálogos/eventos de Wails
```
Métodos en español con verbo: `Crear*`, `Listar*`, `Actualizar*`, `Eliminar*`, `Obtener*`, `Activar*`, `Cerrar*`.

### Agregar un servicio / modelo nuevo
1. Modelo en `internal/domain/<mod>/` → añadir a `AutoMigrate` en `db.go`.
2. DTOs en `internal/application/dtos/<mod>/`.
3. Servicio en `internal/application/services/<mod>/`.
4. Instanciar en `main.go` y añadir a `Bind`. Si necesita ctx: pasarlo a `NewApp` y llamar `SetContext` en `app.go` `startup`.
5. `wails dev` / `wails generate module` para regenerar bindings.

### Periodo lectivo: año de trabajo vs año en consulta
`internal/application/helpers/periodo` centraliza esto (leer antes de tocar cualquier servicio por periodo):
- **Año de trabajo** = `periodo_lectivos.es_activo`. Todo lo nuevo se registra ahí. Cerrar el año lo deja activo en solo lectura hasta activar el siguiente; un periodo cerrado no se puede activar.
- **Año en consulta** = selector del Header (`PeriodSelector.jsx`). Vive solo en memoria del backend (`periodo.SetConsulta`), al reiniciar vuelve al año de trabajo. El frontend recarga la ventana al cambiarlo.
- **Lecturas** por periodo: usar `periodo.ConsultaID(db)`, nunca `es_activo` directo.
- **Escrituras**: validar con `periodo.ValidarEditable` / `ValidarCursoEditable` / `ValidarMatriculaEditable` / `ValidarActivoEditable`.
- **Frontend**: `usePeriodoVista()` (`src/hooks/`) da `soloLectura`; ocultar botones de crear/editar/eliminar con eso. `ObtenerPeriodoVista` reemplaza a `ObtenerPeriodoActivo` en pantallas.

### Gotcha: bindings de Wails
La carpeta en `frontend/wailsjs/go/<pkg>/` usa el **nombre del paquete Go**, no el directorio. Casi todos los servicios declaran `package services`, así que sus bindings están en `wailsjs/go/services/` (Auth, Course, Distributivo, Enrollment, Institution, Management, Notifications, SecurityConfig, Student, Teacher, Template, Tracking, User). Excepciones: `academic/`, `dashboard/`, `reports/`, `search/`, `system/`, `main/` (App). `wailsjs/` es generado: no editar a mano.

## Arquitectura (frontend)
- `src/App.jsx`: providers (ScreenLock, Notifications, Tutorial) + todas las rutas. Rutas en español kebab-case (`/gestion-academica/periodos-lectivos`).
- `src/constants/items.js`: menú del Sidebar (title, path, id, icon como string de lucide). Ruta nueva = añadir en `App.jsx` **y** en `items.js`.
- `src/pages/<Modulo>/`: una página por pantalla. Import directo: `import { ListarPeriodos } from '../../../wailsjs/go/academic/YearService'`.
- Patrón página: `useState` + `useEffect(load)`, `try/catch` con `toast.error(...)`, modales inline, Tailwind (acento violeta `#7c3aed`).
- `src/components/`: Sidebar, Header, LoginScreen, LockScreen, SecurityWrapper, ModuleAuthGate, GlobalSearch, UpdateNotification.
- `src/tutorials/`: pasos de driver.js; usan los `id` de `items.js`.
- Ojo mayúsculas: hay carpetas `academic`, `faculty`, `student` en minúscula y `Enrollment`, `Reports`, etc. en mayúscula. `App.jsx` importa `./pages/Academic/Level` (funciona en Windows, rompe en Linux/macOS).

## Configuración
`.env` (gitignored, ver `.env.example`): `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME`, `DB_PATH` (actualmente ignorado por `InitDB`), `APP_ENV`, `TELEGRAM_API_URL`, `TELEGRAM_API_KEY`. `SEED_DEMO=true` carga datos ficticios (`internal/infrastructure/database/seed_demo.go`) al arrancar, solo si no hay estudiantes; para recargar, borrar `%APPDATA%/SigDECE/sigdece.db`. Usuarios demo: `mvalencia`, `jcaicedo`, `lmontano` / `Demo123!`. En prod, los valores Telegram/APP_ENV se inyectan con `-ldflags "-X dece/internal/config.InjectedTelegramKey=..."`.

## Versionado / release
Bump en dos lugares: `CurrentVersion` en `updater.go` y `info.productVersion` en `wails.json`. Commit `chore: bump application version to X.Y.Z`. Commits en Conventional Commits (inglés).
