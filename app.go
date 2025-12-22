package main

import (
	"context"
	"dece/internal/infrastructure/database"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	database.InitDB()
	database.SeedAdminUser()
}
