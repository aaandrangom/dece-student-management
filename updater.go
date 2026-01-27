package main

import (
	"encoding/json"
	"net/http"

	"github.com/hashicorp/go-version"
	"github.com/minio/selfupdate"
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
	// REEMPLAZA ESTO CON TU URL DE R2
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
	// 1. Volvemos a pedir la URL (o podrías pasarla como argumento desde el front)
	// Para simplificar, repetimos la lógica rápida
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
	// selfupdate se encarga de renombrar el .exe actual a .old en Windows
	err = selfupdate.Apply(exeResp.Body, selfupdate.Options{})
	if err != nil {
		// En caso de error, selfupdate suele restaurar el original
		return "Error al aplicar actualización: " + err.Error()
	}

	return "SUCCESS"
}
