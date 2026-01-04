package main

import (
	"context"
	services "dece/internal/application/services/enrollment"
	notificationsSvc "dece/internal/application/services/notifications"
	tracking "dece/internal/application/services/tracking"
)

type App struct {
	ctx               context.Context
	enrollmentService *services.EnrollmentService
	trackingService   *tracking.TrackingService
	notificationsSvc  *notificationsSvc.NotificationsService
}

func NewApp(enrollmentService *services.EnrollmentService, trackingService *tracking.TrackingService, notificationsService *notificationsSvc.NotificationsService) *App {
	return &App{
		enrollmentService: enrollmentService,
		trackingService:   trackingService,
		notificationsSvc:  notificationsService,
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
}
