package main

import (
	"encoding/json"
	"net/http"
	"os"
	"os/exec"

	"github.com/hashicorp/go-version"
	"github.com/minio/selfupdate"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const CurrentVersion = "1.2.1"

// GetVersion expone la versión actual al frontend
func (a *App) GetVersion() string {
	return CurrentVersion
}

type UpdateInfo struct {
	Version     string `json:"version"`
	DownloadURL string `json:"download_url"`
}

type UpdateCheckResult struct {
	Available bool   `json:"available"`
	Version   string `json:"version"`
	Current   string `json:"current"`
	Error     string `json:"error,omitempty"`
}

func (a *App) CheckUpdate() UpdateCheckResult {
	const versionURL = "https://pub-5f8dc7e2cbc145af89c5cfe85612a8c7.r2.dev/version.json"
	resp, err := http.Get(versionURL)
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
		}
	}

	return UpdateCheckResult{Available: false, Current: CurrentVersion}
}

func (a *App) DoUpdate() string {
	const versionURL = "https://pub-5f8dc7e2cbc145af89c5cfe85612a8c7.r2.dev/version.json"

	resp, err := http.Get(versionURL)
	if err != nil {
		return "Error al conectar con servidor"
	}
	defer resp.Body.Close()

	var info UpdateInfo
	json.NewDecoder(resp.Body).Decode(&info)

	exeResp, err := http.Get(info.DownloadURL)
	if err != nil {
		return "Error al descargar actualización"
	}
	defer exeResp.Body.Close()

	err = selfupdate.Apply(exeResp.Body, selfupdate.Options{})
	if err != nil {
		return "Error al aplicar actualización: " + err.Error()
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
