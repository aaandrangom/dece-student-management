package dashboard

import (
	"context"
	dtos "dece/internal/application/dtos/dashboard"
	"fmt"

	"gorm.io/gorm"
)

type DashboardService struct {
	db  *gorm.DB
	ctx context.Context
}

func NewDashboardService(db *gorm.DB) *DashboardService {
	return &DashboardService{db: db}
}

func (s *DashboardService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

func (s *DashboardService) GetDashboardData() (*dtos.DashboardDataDTO, error) {
	data := &dtos.DashboardDataDTO{}
	var err error

	// 1. KPIs
	// A. Total Estudiantes Activos
	s.db.Raw(`
		SELECT COUNT(*) 
		FROM matriculas m
		JOIN cursos c ON m.curso_id = c.id
		JOIN periodo_lectivos p ON c.periodo_id = p.id
		WHERE p.es_activo = 1 AND m.estado = 'Matriculado'
	`).Scan(&data.KPI.TotalEstudiantes)

	// B. Casos Sensibles Abiertos
	s.db.Raw(`
		SELECT COUNT(*) 
		FROM caso_sensibles c
		JOIN periodo_lectivos p ON c.periodo_id = p.id
		WHERE p.es_activo = 1 AND c.estado = 'Abierto'
	`).Scan(&data.KPI.CasosAbiertos)

	// C. Citas Pendientes
	s.db.Raw(`
		SELECT COUNT(*) FROM convocatoria WHERE cita_completada = 0
	`).Scan(&data.KPI.CitasPendientes)

	// D. Total Sanciones Este Mes
	// Using SQLite strftime
	s.db.Raw(`
		SELECT COUNT(*) 
		FROM llamado_atencions
		WHERE strftime('%Y-%m', fecha) = strftime('%Y-%m', 'now')
	`).Scan(&data.KPI.SancionesMes)

	// 2. Próximas Citas (Agenda)
	err = s.db.Raw(`
		SELECT 
			e.apellidos || ' ' || e.nombres as estudiante,
			ne.nombre || ' ' || c.paralelo as curso,
			con.entidad,
			con.motivo,
			con.fecha_cita,
			con.dias_alerta as dias_alerta
		FROM convocatoria con
		JOIN matriculas m ON con.matricula_id = m.id
		JOIN estudiantes e ON m.estudiante_id = e.id
		JOIN cursos c ON m.curso_id = c.id
		JOIN nivel_educativos ne ON c.nivel_id = ne.id
		WHERE con.cita_completada = 0
		ORDER BY con.fecha_cita ASC
		LIMIT 10
	`).Scan(&data.CitasProximas).Error
	if err != nil {
		fmt.Printf("Error Agenda: %v\n", err)
	}

	// 3. Gráficos
	// A. Top Cursos Conflictivos
	s.db.Raw(`
		SELECT 
			ne.nombre || ' ' || c.paralelo as curso,
			COUNT(la.id) as cantidad_faltas
		FROM llamado_atencions la
		JOIN matriculas m ON la.matricula_id = m.id
		JOIN cursos c ON m.curso_id = c.id
		JOIN nivel_educativos ne ON c.nivel_id = ne.id
		JOIN periodo_lectivos p ON c.periodo_id = p.id
		WHERE p.es_activo = 1
		GROUP BY c.id
		ORDER BY cantidad_faltas DESC
		LIMIT 5
	`).Scan(&data.CursosConflictivos)

	// B. Casos Sensibles por Tipo
	// Note: 'tipo_caso' column needs to exist in casos_sensibles.
	// Last turn I added 'TipoCaso' to 'CasoSensible' struct. Check DB column name.
	// Typically struct field TipoCaso -> snake_case 'tipo_caso'.
	s.db.Raw(`
		SELECT 
			tipo_caso,
			COUNT(*) as cantidad
		FROM caso_sensibles cs
		JOIN periodo_lectivos p ON cs.periodo_id = p.id
		WHERE p.es_activo = 1
		GROUP BY tipo_caso
	`).Scan(&data.CasosPorTipo)

	// C. Distribución por Género
	s.db.Raw(`
		SELECT 
			e.genero_nacimiento as genero,
			COUNT(*) as cantidad
		FROM estudiantes e
		JOIN matriculas m ON e.id = m.estudiante_id
		JOIN cursos c ON m.curso_id = c.id
		JOIN periodo_lectivos p ON c.periodo_id = p.id
		WHERE p.es_activo = 1
		GROUP BY e.genero_nacimiento
	`).Scan(&data.EstudiantesGenero)

	// 4. Feed de Actividad
	// Corrected table names in UNION
	// Using common.JSONMap for capacitaciones might need specific handling but raw SQL json_extract works on TEXT column.
	// 'detalle_audiencia' is TEXT.
	// Note on SQLite dates: 'now' is UTC. Ensure dates are consistent.
	err = s.db.Raw(`
		SELECT * FROM (
			-- Llamados
			SELECT 
				'DISCIPLINA' as tipo,
				la.fecha as fecha,
				'Falta: ' || substr(la.motivo, 1, 30) || '...' as descripcion,
				e.apellidos || ' ' || e.nombres as estudiante
			FROM llamado_atencions la
			JOIN matriculas m ON la.matricula_id = m.id
			JOIN estudiantes e ON m.estudiante_id = e.id

			UNION ALL

			-- Casos
			SELECT 
				'CASO' as tipo,
				cs.fecha_deteccion as fecha,
				'Caso ' || cs.codigo_caso || ' (' || cs.tipo_caso || ')' as descripcion,
				e.apellidos || ' ' || e.nombres as estudiante
			FROM caso_sensibles cs
			JOIN estudiantes e ON cs.estudiante_id = e.id

			UNION ALL

			-- Capacitaciones
			SELECT 
				'TALLER' as tipo,
				cap.fecha as fecha,
				'Tema: ' || cap.tema as descripcion,
				'Grupo: ' || json_extract(cap.detalle_audiencia, '$.grupo_objetivo') as estudiante
			FROM capacitacions cap
		) 
		ORDER BY fecha DESC
		LIMIT 10
	`).Scan(&data.ActividadReciente).Error
	if err != nil {
		fmt.Printf("Error Feed: %v\n", err)
		// Don't fail the whole dashboard if feed fails (e.g. json_extract issues)
		data.ActividadReciente = []dtos.ActividadDTO{}
	}

	// ensure slices are not nil
	if data.CitasProximas == nil {
		data.CitasProximas = []dtos.CitaProximaDTO{}
	}
	if data.CursosConflictivos == nil {
		data.CursosConflictivos = []dtos.CursoConflictivoDTO{}
	}
	if data.CasosPorTipo == nil {
		data.CasosPorTipo = []dtos.CasoPorTipoDTO{}
	}
	if data.EstudiantesGenero == nil {
		data.EstudiantesGenero = []dtos.GeneroDTO{}
	}
	if data.ActividadReciente == nil {
		data.ActividadReciente = []dtos.ActividadDTO{}
	}

	return data, nil
}
