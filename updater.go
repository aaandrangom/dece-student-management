package main

import (
	"encoding/json"
	"net/http"
	"os"      // <--- AGREGADO: Para obtener la ruta del ejecutable
	"os/exec" // <--- AGREGADO: Para ejecutar el comando de reinicio

	"github.com/hashicorp/go-version"
	"github.com/minio/selfupdate"
	"github.com/wailsapp/wails/v2/pkg/runtime" // <--- AGREGADO: Para usar runtime.Quit
)

// Constante con tu versión actual (esto lo cambiarás antes de compilar cada update)
const CurrentVersion = "1.0.0"

// Estructura del JSON que leeremos de R2
type UpdateInfo struct {
	Version     string `json:"version"`
	DownloadURL string `json:"download_url"`
}

// Estructura de respuesta para el Frontend
type UpdateCheckResult struct {
	Available bool   `json:"available"`
	Version   string `json:"version"`
	Current   string `json:"current"`
	Error     string `json:"error,omitempty"`
}

// CheckUpdate revisa si hay una versión superior en R2
func (a *App) CheckUpdate() UpdateCheckResult {
	// 1. URL de tu archivo version.json en R2
	const versionURL = "https://pub-5f8dc7e2cbc145af89c5cfe85612a8c7.r2.dev/version.json"

	// 2. Descargar el JSON
	resp, err := http.Get(versionURL)
	if err != nil {
		return UpdateCheckResult{Error: "Error de red: " + err.Error()}
	}
	defer resp.Body.Close()

	var info UpdateInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return UpdateCheckResult{Error: "JSON inválido"}
	}

	// 3. Comparar versiones usando hashicorp/go-version
	vRemote, err := version.NewVersion(info.Version)
	vLocal, _ := version.NewVersion(CurrentVersion)

	if err != nil {
		return UpdateCheckResult{Error: "Versión remota inválida"}
	}

	// Si la remota es mayor que la local
	if vRemote.GreaterThan(vLocal) {
		return UpdateCheckResult{
			Available: true,
			Version:   info.Version,
			Current:   CurrentVersion,
		}
	}

	return UpdateCheckResult{Available: false, Current: CurrentVersion}
}

// DoUpdate realiza la actualización física
func (a *App) DoUpdate() string {
	const versionURL = "https://pub-5f8dc7e2cbc145af89c5cfe85612a8c7.r2.dev/version.json"

	resp, err := http.Get(versionURL)
	if err != nil {
		return "Error al conectar con servidor"
	}
	defer resp.Body.Close()

	var info UpdateInfo
	json.NewDecoder(resp.Body).Decode(&info)

	// 2. Descargar el binario ejecutable (.exe)
	exeResp, err := http.Get(info.DownloadURL)
	if err != nil {
		return "Error al descargar actualización"
	}
	defer exeResp.Body.Close()

	// 3. Magia: Aplicar la actualización sobre sí mismo
	err = selfupdate.Apply(exeResp.Body, selfupdate.Options{})
	if err != nil {
		return "Error al aplicar actualización: " + err.Error()
	}

	return "SUCCESS"
}

// ---------------------------------------------------------
//
//	NUEVA FUNCIÓN AGREGADA PARA REINICIAR LA APP
//
// ---------------------------------------------------------
func (a *App) RestartApp() {
	// 1. Obtener la ruta del ejecutable actual (que ya es el nuevo)
	executable, err := os.Executable()
	if err != nil {
		runtime.LogError(a.ctx, "Error obteniendo ejecutable: "+err.Error())
		return
	}

	// 2. Crear el comando para abrirse a sí mismo
	cmd := exec.Command(executable)

	// 3. Soltar el proceso (Start no bloquea, lanza el proceso aparte)
	err = cmd.Start()
	if err != nil {
		runtime.LogError(a.ctx, "Error al reiniciar: "+err.Error())
		return
	}

	// 4. Cerrar la instancia actual
	runtime.Quit(a.ctx)
}
