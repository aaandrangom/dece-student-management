package main

import (
	"context"
	services "dece/internal/application/services/enrollment"
)

type App struct {
	ctx               context.Context
	enrollmentService *services.EnrollmentService
}

func NewApp(enrollmentService *services.EnrollmentService) *App {
	return &App{
		enrollmentService: enrollmentService,
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.enrollmentService.SetContext(ctx)
}
