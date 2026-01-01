package main

import (
	"context"
	services "dece/internal/application/services/enrollment"
	tracking "dece/internal/application/services/tracking"
)

type App struct {
	ctx               context.Context
	enrollmentService *services.EnrollmentService
	trackingService   *tracking.TrackingService
}

func NewApp(enrollmentService *services.EnrollmentService, trackingService *tracking.TrackingService) *App {
	return &App{
		enrollmentService: enrollmentService,
		trackingService:   trackingService,
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.enrollmentService.SetContext(ctx)
	a.trackingService.SetContext(ctx)
}
