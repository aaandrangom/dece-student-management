package main

import (
	"dece/internal/application/services"
	"dece/internal/infrastructure/database"
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Initialize Database
	database.InitDB()
	database.SeedAdminUser()

	// Initialize Services
	authService := services.NewAuthService(database.DB)
	academicService := services.NewAcademicService(database.DB)

	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:            "dece",
		Width:            1024,
		Height:           768,
		WindowStartState: options.Maximised,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
			authService,
			academicService,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
