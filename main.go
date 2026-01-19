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
	dashboard "dece/internal/application/services/dashboard"
	enrollment "dece/internal/application/services/enrollment"
	faculty "dece/internal/application/services/faculty"
	management "dece/internal/application/services/management"
	notifications "dece/internal/application/services/notifications"
	reports "dece/internal/application/services/reports"
	search "dece/internal/application/services/search"
	security "dece/internal/application/services/security"
	student "dece/internal/application/services/student"
	telegramSync "dece/internal/application/services/sync"
	system "dece/internal/application/services/system"
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

	telegramSyncService := telegramSync.NewTelegramSyncService(db)
	managementService := management.NewManagementService(db, telegramSyncService)
	dashboardService := dashboard.NewDashboardService(db)
	notificationsService := notifications.NewNotificationsService(db)
	reportService := reports.NewReportService(db, institutionService, teacherService)
	searchService := search.NewSearchService(db)
	maintenanceService := system.NewMaintenanceService(db)

	app := NewApp(enrollmentService, trackingService, notificationsService, telegramSyncService, studentService, searchService, maintenanceService)

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
			dashboardService,
			notificationsService,
			reportService,
			searchService,
			maintenanceService,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
