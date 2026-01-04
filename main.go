package main

import (
	"dece/internal/config"
	"dece/internal/infrastructure/database"
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"

	academic "dece/internal/application/services/academic"
	enrollment "dece/internal/application/services/enrollment"
	faculty "dece/internal/application/services/faculty"
	management "dece/internal/application/services/management"
	notifications "dece/internal/application/services/notifications"
	security "dece/internal/application/services/security"
	student "dece/internal/application/services/student"
	tracking "dece/internal/application/services/tracking"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	if err := config.LoadConfig(); err != nil {
		log.Fatalf("Error cargando configuración: %v", err)
	}

	db := database.InitDB()
	database.SeedAll(db)

	authService := security.NewAuthService(db)
	userService := security.NewUserService(db)
	institutionService := security.NewInstitutionService(db)

	yearService := academic.NewYearService(db)
	levelService := academic.NewLevelService(db)
	subjectService := academic.NewSubjectService(db)

	teacherService := faculty.NewTeacherService(db)
	courseService := faculty.NewCourseService(db)
	teachingLoadService := faculty.NewDistributivoService(db)

	studentService := student.NewStudentService(db)

	enrollmentService := enrollment.NewEnrollmentService(db)

	trackingService := tracking.NewTrackingService(db)

	managementService := management.NewManagementService(db)
	notificationsService := notifications.NewNotificationsService(db)

	app := NewApp(enrollmentService, trackingService, notificationsService)

	err := wails.Run(&options.App{
		Title:            "SIGDECE",
		Width:            1280,
		Height:           720,
		WindowStartState: options.Maximised,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []any{
			app,

			authService,
			userService,
			institutionService,

			yearService,
			levelService,
			subjectService,

			teacherService,
			courseService,
			teachingLoadService,

			studentService,

			enrollmentService,

			trackingService,

			managementService,
			notificationsService,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
