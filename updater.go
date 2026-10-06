package main

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"sync/atomic"
	"time"

	"github.com/hashicorp/go-version"
	"github.com/minio/selfupdate"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const CurrentVersion = "1.3.1"

// GetVersion expone la versión actual al frontend
func (a *App) GetVersion() string {
	return CurrentVersion
}

// NotaVersion es un cambio de una versión: tipo "nuevo", "mejora" o "correccion".
type NotaVersion struct {
	Tipo  string `json:"tipo"`
	Texto string `json:"texto"`
}

// UpdateInfo es el contenido de version.json en R2 (lo genera scripts/build-release.ps1).
// fecha, resumen y notas son opcionales: las versiones antiguas del sistema los ignoran.
type UpdateInfo struct {
	Version     string        `json:"version"`
	DownloadURL string        `json:"download_url"`
	Fecha       string        `json:"fecha,omitempty"`
	Resumen     string        `json:"resumen,omitempty"`
	Notas       []NotaVersion `json:"notas,omitempty"`
	SHA256      string        `json:"sha256,omitempty"` // checksum del .exe; si viene, se verifica antes de instalar
}

type UpdateCheckResult struct {
	Available bool          `json:"available"`
	Version   string        `json:"version"`
	Current   string        `json:"current"`
	Fecha     string        `json:"fecha,omitempty"`
	Resumen   string        `json:"resumen,omitempty"`
	Notas     []NotaVersion `json:"notas,omitempty"`
	Error     string        `json:"error,omitempty"`
}

func (a *App) CheckUpdate() UpdateCheckResult {
	resp, err := (&http.Client{Timeout: 20 * time.Second}).Get(versionURL)
	if err != nil {
		return UpdateCheckResult{Error: "Error de red: " + err.Error()}
	}
	defer resp.Body.Close()

	var info UpdateInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return UpdateCheckResult{Error: "JSON inválido"}
	}

	vRemote, err := version.NewVersion(info.Version)
	vLocal, _ := version.NewVersion(CurrentVersion)

	if err != nil {
		return UpdateCheckResult{Error: "Versión remota inválida"}
	}

	if vRemote.GreaterThan(vLocal) {
		return UpdateCheckResult{
			Available: true,
			Version:   info.Version,
			Current:   CurrentVersion,
			Fecha:     info.Fecha,
			Resumen:   info.Resumen,
			Notas:     info.Notas,
		}
	}

	return UpdateCheckResult{Available: false, Current: CurrentVersion}
}

const (
	versionURL = "https://pub-5f8dc7e2cbc145af89c5cfe85612a8c7.r2.dev/version.json"
	// Si la descarga pasa este tiempo sin recibir datos, se cancela en lugar de quedar colgada.
	descargaSinDatosMax = 60 * time.Second
	eventoProgreso      = "update:progress"
)

// ProgresoActualizacion se envía al frontend durante DoUpdate.
type ProgresoActualizacion struct {
	Fase       string `json:"fase"`       // "conectando", "descargando", "instalando"
	Descargado int64  `json:"descargado"` // bytes
	Total      int64  `json:"total"`      // bytes; -1 si el servidor no lo informa
}

func (a *App) emitirProgreso(p ProgresoActualizacion) {
	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, eventoProgreso, p)
	}
}

// lectorConProgreso cuenta los bytes leídos y avisa al frontend como máximo cada 150 ms.
type lectorConProgreso struct {
	r            io.Reader
	app          *App
	total        int64
	leido        int64
	ultimoAviso  time.Time
	ultimoDatoNs *atomic.Int64
}

func (l *lectorConProgreso) Read(p []byte) (int, error) {
	n, err := l.r.Read(p)
	if n > 0 {
		l.leido += int64(n)
		l.ultimoDatoNs.Store(time.Now().UnixNano())
		if time.Since(l.ultimoAviso) >= 150*time.Millisecond {
			l.ultimoAviso = time.Now()
			l.app.emitirProgreso(ProgresoActualizacion{Fase: "descargando", Descargado: l.leido, Total: l.total})
		}
	}
	if err == io.EOF {
		// Descarga completa: selfupdate verifica y reemplaza el ejecutable.
		l.app.emitirProgreso(ProgresoActualizacion{Fase: "instalando", Descargado: l.leido, Total: l.total})
	}
	return n, err
}

func (a *App) DoUpdate() string {
	a.emitirProgreso(ProgresoActualizacion{Fase: "conectando", Total: -1})

	cliente := &http.Client{Timeout: 20 * time.Second}
	resp, err := cliente.Get(versionURL)
	if err != nil {
		return "No se pudo conectar con el servidor de actualizaciones. Revise su conexión a internet."
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Sprintf("El servidor de actualizaciones respondió con un error (%d).", resp.StatusCode)
	}

	var info UpdateInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil || info.DownloadURL == "" {
		return "La información de la actualización no es válida."
	}

	opciones := selfupdate.Options{}
	if info.SHA256 != "" {
		checksum, err := hex.DecodeString(strings.TrimSpace(info.SHA256))
		if err != nil {
			return "El checksum de la actualización no es válido."
		}
		opciones.Checksum = checksum // selfupdate usa SHA-256 por defecto
	}

	// La descarga no tiene tiempo total máximo (puede ser lenta), pero se cancela si se detiene.
	ctx, cancelar := context.WithCancel(context.Background())
	defer cancelar()
	var ultimoDato atomic.Int64
	ultimoDato.Store(time.Now().UnixNano())
	var detenida atomic.Bool
	go func() {
		tick := time.NewTicker(5 * time.Second)
		defer tick.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-tick.C:
				if time.Since(time.Unix(0, ultimoDato.Load())) > descargaSinDatosMax {
					detenida.Store(true)
					cancelar()
					return
				}
			}
		}
	}()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, info.DownloadURL, nil)
	if err != nil {
		return "El enlace de descarga no es válido."
	}
	exeResp, err := http.DefaultClient.Do(req)
	if err != nil {
		if detenida.Load() {
			return "La descarga se detuvo por falta de conexión. Intente de nuevo."
		}
		return "No se pudo descargar la actualización. Revise su conexión a internet."
	}
	defer exeResp.Body.Close()
	if exeResp.StatusCode != http.StatusOK {
		return fmt.Sprintf("No se pudo descargar la actualización (error %d del servidor).", exeResp.StatusCode)
	}

	total := exeResp.ContentLength // -1 si el servidor no lo informa
	a.emitirProgreso(ProgresoActualizacion{Fase: "descargando", Total: total})
	lector := &lectorConProgreso{r: exeResp.Body, app: a, total: total, ultimoDatoNs: &ultimoDato}

	if err := selfupdate.Apply(lector, opciones); err != nil {
		if detenida.Load() {
			return "La descarga se detuvo por falta de conexión. Intente de nuevo."
		}
		if rerr := selfupdate.RollbackError(err); rerr != nil {
			return "Error grave al actualizar: no se pudo restaurar la versión anterior. Reinstale el sistema."
		}
		if opciones.Checksum != nil && strings.Contains(strings.ToLower(err.Error()), "checksum") {
			return "El archivo descargado está incompleto o dañado. Intente de nuevo."
		}
		return "Error al aplicar la actualización: " + err.Error()
	}

	return "SUCCESS"
}

func (a *App) RestartApp() {
	executable, err := os.Executable()
	if err != nil {
		runtime.LogError(a.ctx, "Error obteniendo ejecutable: "+err.Error())
		return
	}

	cmd := exec.Command(executable)

	err = cmd.Start()
	if err != nil {
		runtime.LogError(a.ctx, "Error al reiniciar: "+err.Error())
		return
	}

	runtime.Quit(a.ctx)
}
