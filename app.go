package main

import (
	"context"
	services "dece/internal/application/services/enrollment"
	notificationsSvc "dece/internal/application/services/notifications"
	telegramSync "dece/internal/application/services/sync"
	tracking "dece/internal/application/services/tracking"
)

type App struct {
	ctx                 context.Context
	enrollmentService   *services.EnrollmentService
	trackingService     *tracking.TrackingService
	notificationsSvc    *notificationsSvc.NotificationsService
	telegramSyncService *telegramSync.TelegramSyncService
}

func NewApp(enrollmentService *services.EnrollmentService, trackingService *tracking.TrackingService, notificationsService *notificationsSvc.NotificationsService, telegramSyncService *telegramSync.TelegramSyncService) *App {
	return &App{
		enrollmentService:   enrollmentService,
		trackingService:     trackingService,
		notificationsSvc:    notificationsService,
		telegramSyncService: telegramSyncService,
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.enrollmentService.SetContext(ctx)
	a.trackingService.SetContext(ctx)
	if a.notificationsSvc != nil {
		a.notificationsSvc.SetContext(ctx)
		a.notificationsSvc.StartScheduler()
	}
	if a.telegramSyncService != nil {
		go a.telegramSyncService.SyncConvocatorias()
	}
}
