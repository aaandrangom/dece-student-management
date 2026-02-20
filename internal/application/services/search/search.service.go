package search

import (
	"context"
	"dece/internal/application/dtos/search"
	"fmt"
	"strings"

	"gorm.io/gorm"
)

type SearchService struct {
	ctx context.Context
	db  *gorm.DB
}

func NewSearchService(db *gorm.DB) *SearchService {
	return &SearchService{db: db}
}

func (s *SearchService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

func (s *SearchService) BusquedaGlobal(query string) ([]search.GlobalSearchResultDTO, error) {
	var results []search.GlobalSearchResultDTO
	query = strings.TrimSpace(query)

	if len(query) < 2 {
		return results, nil
	}

	likeQuery := "%" + query + "%"
	lowerQuery := strings.ToLower(query)

	menus := []struct {
		Title, Desc, Route, Icon string
	}{
		{"Inicio / Dashboard", "Pantalla principal", "/panel-principal", "LayoutDashboard"},
		{"Estudiantes", "Directorio y fichas de alumnos", "/estudiantes/listado-general", "Users"},
		{"Ficha DECE", "Gestión de matrículas y fichas", "/estudiantes/ficha-dece", "BookOpen"},
		{"Docentes", "Planta docente y personal", "/gestion-academica/docentes", "GraduationCap"},
		{"Cursos", "Gestión de aulas y paralelos", "/gestion-academica/cursos-distributivo", "School"},
		{"Seguimiento DECE", "Disciplina y casos sensibles", "/dece", "ClipboardCheck"},
		{"Notificaciones", "Alertas y mensajes del sistema", "/notificaciones", "Bell"},
		{"Configuración Institucional", "Ajustes del colegio", "/institucion/configuracion-general", "Building"},
		{"Configuración Usuarios", "Gestión de usuarios y accesos", "/institucion/usuarios-sistema", "Settings"},
		{"Convocatorias", "Agenda de citas", "/agenda/convocatorias", "Calendar"},
	}

	for _, m := range menus {
		if strings.Contains(strings.ToLower(m.Title), lowerQuery) || strings.Contains(strings.ToLower(m.Desc), lowerQuery) {
			results = append(results, search.GlobalSearchResultDTO{
				Type:        search.ResultTypeNavigation,
				Title:       m.Title,
				Description: m.Desc,
				Route:       m.Route,
				Icon:        m.Icon,
			})
		}
	}

	actions := []struct {
		Title, Desc, Route, Icon string
	}{
		{"Nuevo Estudiante", "Registrar un nuevo alumno", "action:new_student", "UserPlus"},
		{"Nueva Notificación", "Crear alerta o comunicado", "action:new_notification", "BellPlus"},
		{"Reporte General", "Generar reporte institucional", "action:report_general", "FileText"},
	}

	for _, a := range actions {
		if strings.Contains(strings.ToLower(a.Title), lowerQuery) {
			results = append(results, search.GlobalSearchResultDTO{
				Type:        search.ResultTypeAction,
				Title:       a.Title,
				Description: a.Desc,
				Route:       a.Route,
				Icon:        a.Icon,
			})
		}
	}

	type StudentResult struct {
		ID              uint
		Nombres         string
		Apellidos       string
		Cedula          string
		TieneCaso       bool
		TieneDisciplina bool
	}

	var students []StudentResult

	err := s.db.Raw(`
        SELECT 
            e.id, 
            e.nombres, 
            e.apellidos, 
            e.cedula,
            EXISTS(SELECT 1 FROM casos_sensibles cs WHERE cs.estudiante_id = e.id) as tiene_caso,
            EXISTS(SELECT 1 FROM llamado_atencions la JOIN matriculas m ON m.id = la.matricula_id WHERE m.estudiante_id = e.id) as tiene_disciplina
        FROM estudiantes e
        WHERE (e.nombres LIKE ? OR e.apellidos LIKE ? OR e.cedula LIKE ?)
        LIMIT 8
    `, likeQuery, likeQuery, likeQuery).Scan(&students).Error

	if err == nil {
		for _, st := range students {
			results = append(results, search.GlobalSearchResultDTO{
				Type:              search.ResultTypeStudent,
				ID:                st.ID,
				Title:             fmt.Sprintf("%s %s", st.Apellidos, st.Nombres),
				Description:       fmt.Sprintf("C.I: %s", st.Cedula),
				Route:             "/estudiantes/listado-general",
				Icon:              "User",
				TieneCasoSensible: st.TieneCaso,
				TieneDisciplina:   st.TieneDisciplina,
			})
		}
	}

	return results, nil
}
