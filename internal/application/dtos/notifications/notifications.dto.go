package dto

type NotificacionDTO struct {
	ID              uint   `json:"id"`
	Tipo            string `json:"tipo"`
	RolDestino      string `json:"rol_destino"`
	FechaProgramada string `json:"fecha_programada"`
	Momento         string `json:"momento"`
	Titulo          string `json:"titulo"`
	Mensaje         string `json:"mensaje"`
	Leida           bool   `json:"leida"`
	FechaCreacion   string `json:"fecha_creacion"`
}

type NotificacionesPaginadasDTO struct {
	Items    []NotificacionDTO `json:"items"`
	Total    int64             `json:"total"`
	Page     int               `json:"page"`
	PageSize int               `json:"page_size"`
}

type ResumenNotificacionesDTO struct {
	Items       []NotificacionDTO `json:"items"`
	UnreadCount int               `json:"unread_count"`
}
