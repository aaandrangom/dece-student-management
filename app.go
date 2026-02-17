package main

import (
	"context"
	services "dece/internal/application/services/enrollment"
	managementSvc "dece/internal/application/services/management"
	notificationsSvc "dece/internal/application/services/notifications"
	searchSvc "dece/internal/application/services/search"
	studentSvc "dece/internal/application/services/student"
	telegramSync "dece/internal/application/services/sync"
	system "dece/internal/application/services/system"
	tracking "dece/internal/application/services/tracking"
)

type App struct {
	ctx                 context.Context
	enrollmentService   *services.EnrollmentService
	trackingService     *tracking.TrackingService
	notificationsSvc    *notificationsSvc.NotificationsService
	telegramSyncService *telegramSync.TelegramSyncService
	studentService      *studentSvc.StudentService
	searchService       *searchSvc.SearchService
	maintenanceService  *system.MaintenanceService
	templateService     *managementSvc.TemplateService
}

func NewApp(enrollmentService *services.EnrollmentService, trackingService *tracking.TrackingService, notificationsService *notificationsSvc.NotificationsService, telegramSyncService *telegramSync.TelegramSyncService, studentService *studentSvc.StudentService, searchService *searchSvc.SearchService, maintenanceService *system.MaintenanceService, templateService *managementSvc.TemplateService) *App {
	return &App{
		enrollmentService:   enrollmentService,
		trackingService:     trackingService,
		notificationsSvc:    notificationsService,
		telegramSyncService: telegramSyncService,
		studentService:      studentService,
		searchService:       searchService,
		maintenanceService:  maintenanceService,
		templateService:     templateService,
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.enrollmentService.SetContext(ctx)
	a.trackingService.SetContext(ctx)
	a.studentService.SetContext(ctx)
	a.searchService.SetContext(ctx)
	a.maintenanceService.SetContext(ctx)
	a.templateService.SetContext(ctx)
	if a.notificationsSvc != nil {
		a.notificationsSvc.SetContext(ctx)
		a.notificationsSvc.StartScheduler()
	}
	if a.telegramSyncService != nil {
		go a.telegramSyncService.SyncCompleta()
	}
}
