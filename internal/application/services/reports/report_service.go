package reports

import (
	dtos "dece/internal/application/dtos/reports"
	faculty "dece/internal/application/services/faculty"
	security "dece/internal/application/services/security"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"

	"github.com/johnfercher/maroto/v2"
	"github.com/johnfercher/maroto/v2/pkg/components/text"
	"github.com/johnfercher/maroto/v2/pkg/config"
	"github.com/johnfercher/maroto/v2/pkg/consts/align"
	"github.com/johnfercher/maroto/v2/pkg/consts/fontstyle"
	"github.com/johnfercher/maroto/v2/pkg/props"
	"gorm.io/gorm"
)

type ReportService struct {
	db             *gorm.DB
	instService    *security.InstitutionService
	teacherService *faculty.TeacherService
}

func NewReportService(db *gorm.DB, instService *security.InstitutionService, teacherService *faculty.TeacherService) *ReportService {
	return &ReportService{
		db:             db,
		instService:    instService,
		teacherService: teacherService,
	}
}

func (s *ReportService) GenerarReporteInstitucional() (string, error) {
	configData, err := s.instService.ObtenerConfiguracion()
	if err != nil {
		return "", err
	}

	cfg := config.NewBuilder().
		WithPageNumber().
		WithLeftMargin(15).
		WithTopMargin(15).
		WithRightMargin(15).
		Build()

	m := maroto.New(cfg)

	m.AddRow(12,
		text.NewCol(12, configData.Nombre, props.Text{
			Size:  16,
			Style: fontstyle.Bold,
			Align: align.Center,
		}),
	)
	m.AddRow(10,
		text.NewCol(12, "Reporte Institucional", props.Text{
			Size:  12,
			Style: fontstyle.Italic,
			Align: align.Center,
		}),
	)
	m.AddRow(10,
		text.NewCol(12, fmt.Sprintf("Código AMIE: %s", configData.CodigoAMIE), props.Text{
			Size:  10,
			Align: align.Center,
		}),
	)

	m.AddRow(10)

	m.AddRow(10,
		text.NewCol(12, "Datos Generales", props.Text{
			Size:  12,
			Style: fontstyle.Bold,
		}),
	)
	m.AddRow(1,
		text.NewCol(12, "___________________________________________________________________", props.Text{
			Size: 6,
		}),
	)
	m.AddRow(5)

	m.AddRow(8,
		text.NewCol(3, "Distrito:", props.Text{Style: fontstyle.Bold}),
		text.NewCol(3, configData.Distrito),
		text.NewCol(3, "Circuito:", props.Text{Style: fontstyle.Bold}),
		text.NewCol(3, configData.Circuito),
	)

	m.AddRow(10)
	m.AddRow(10,
		text.NewCol(12, "Ubicación Geográfica", props.Text{
			Size:  12,
			Style: fontstyle.Bold,
		}),
	)
	m.AddRow(1,
		text.NewCol(12, "___________________________________________________________________", props.Text{
			Size: 6,
		}),
	)
	m.AddRow(5)

	m.AddRow(8,
		text.NewCol(3, "Provincia:", props.Text{Style: fontstyle.Bold}),
		text.NewCol(3, configData.Ubicacion.Provincia),
		text.NewCol(3, "Cantón:", props.Text{Style: fontstyle.Bold}),
		text.NewCol(3, configData.Ubicacion.Canton),
	)
	m.AddRow(8,
		text.NewCol(3, "Parroquia:", props.Text{Style: fontstyle.Bold}),
		text.NewCol(3, configData.Ubicacion.Parroquia),
		text.NewCol(3, "Barrio/Recinto:", props.Text{Style: fontstyle.Bold}),
		text.NewCol(3, configData.Ubicacion.BarrioRecinto),
	)

	m.AddRow(10)
	m.AddRow(10,
		text.NewCol(12, "Autoridades", props.Text{
			Size:  12,
			Style: fontstyle.Bold,
		}),
	)
	m.AddRow(1,
		text.NewCol(12, "___________________________________________________________________", props.Text{
			Size: 6,
		}),
	)
	m.AddRow(5)

	addAuthorityRow := func(title, name, jornada string) {
		if name == "" {
			name = "N/A"
		}
		if jornada != "" {
			name = fmt.Sprintf("%s (%s)", name, jornada)
		}
		m.AddRow(8,
			text.NewCol(4, title+":", props.Text{Style: fontstyle.Bold}),
			text.NewCol(8, name, props.Text{}),
		)
	}

	addAuthorityRow("Director/a", configData.Autoridades.Rector.Nombres, "")
	addAuthorityRow("Subdirector/a Matutina", configData.Autoridades.SubdirectorMatutina.Nombres, "")
	addAuthorityRow("Subdirector/a Vespertina", configData.Autoridades.SubdirectorVespertina.Nombres, "")
	addAuthorityRow("Inspector General", configData.Autoridades.InspectorGeneral.Nombres, "")
	addAuthorityRow("Subinspector", configData.Autoridades.Subinspector.Nombres, "")
	addAuthorityRow("Coordinador/a DECE", configData.Autoridades.CoordinadorDECE.Nombres, "")
	addAuthorityRow("Analista DECE 1", configData.Autoridades.AnalistaDECE1.Nombres, "")
	addAuthorityRow("Analista DECE 2", configData.Autoridades.AnalistaDECE2.Nombres, "")

	m.RegisterFooter(text.NewRow(10, fmt.Sprintf("Generado el: %s", time.Now().Format("2006-01-02 15:04:05")), props.Text{
		Size:  8,
		Align: align.Center,
		Style: fontstyle.Italic,
	}))

	document, err := m.Generate()
	if err != nil {
		return "", err
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = "."
	}
	savePath := filepath.Join(homeDir, "Documents", "SistemaDECE", "Reportes")
	if err := os.MkdirAll(savePath, os.ModePerm); err != nil {
		return "", err
	}

	fileName := fmt.Sprintf("Reporte_Institucional_%s.pdf", time.Now().Format("20060102_150405"))
	fullPath := filepath.Join(savePath, fileName)

	err = document.Save(fullPath)
	if err != nil {
		return "", err
	}

	return fullPath, nil
}

func (s *ReportService) AbrirUbicacionReporte(path string) error {
	var cmd *exec.Cmd
	dir := filepath.Dir(path)

	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("explorer", "/select,", path)
	case "darwin":
		cmd = exec.Command("open", "-R", path)
	case "linux":
		cmd = exec.Command("xdg-open", dir)
	default:
		return fmt.Errorf("unsupported platform")
	}
	return cmd.Start()
}

func (s *ReportService) ObtenerDatosFichaEstudiantil(cedula string) (*dtos.FichaEstudiantilDTO, error) {
	ficha := &dtos.FichaEstudiantilDTO{}

	queryA := `
		SELECT 
			e.id, 
			e.cedula, e.apellidos, e.nombres, e.fecha_nacimiento, 
			e.genero_nacimiento, e.info_nacionalidad, e.correo_electronico, e.ruta_foto,
			ne.nombre || ' ' || c.paralelo as curso_actual,
			c.jornada,
			m.direccion_actual, m.datos_salud, m.datos_sociales, m.antropometria
		FROM estudiantes e
		LEFT JOIN matriculas m ON e.id = m.estudiante_id
		LEFT JOIN cursos c ON m.curso_id = c.id
		LEFT JOIN nivel_educativos ne ON c.nivel_id = ne.id
		LEFT JOIN periodo_lectivos pl ON c.periodo_id = pl.id
		WHERE e.cedula = ? 
		AND pl.es_activo = 1;`

	if err := s.db.Raw(queryA, cedula).Scan(&ficha.DatosPersonales).Error; err != nil {
		return nil, fmt.Errorf("Error obteniendo datos personales: %v", err)
	}

	queryB := `
		SELECT 
			f.nombres_completos, 
			f.parentesco, 
			f.telefono_personal, 
			f.es_representante_legal, 
			f.vive_con_estudiante,
			f.datos_extendidos
		FROM familiars f
		JOIN estudiantes e ON f.estudiante_id = e.id
		WHERE e.cedula = ?;`

	if err := s.db.Raw(queryB, cedula).Scan(&ficha.Familiares).Error; err != nil {
		return nil, fmt.Errorf("Error obteniendo familiares: %v", err)
	}

	queryC := `
		SELECT 
			la.fecha, 
			la.motivo, 
			la.detalle_sancion,
			la.ruta_acta,
			CASE WHEN la.representante_firmo = 1 THEN 'Firmado' ELSE 'Pendiente' END as estado,
			pl.nombre as periodo_lectivo
		FROM llamado_atencions la
		JOIN matriculas m ON la.matricula_id = m.id
		JOIN cursos c ON m.curso_id = c.id
		JOIN periodo_lectivos pl ON c.periodo_id = pl.id
		JOIN estudiantes e ON m.estudiante_id = e.id
		WHERE e.cedula = ?
		ORDER BY la.fecha DESC;`

	if err := s.db.Raw(queryC, cedula).Scan(&ficha.Disciplina).Error; err != nil {
		return nil, fmt.Errorf("Error obteniendo disciplina: %v", err)
	}

	queryD := `
		SELECT 
			cs.codigo_caso, 
			cs.fecha_deteccion, 
			cs.tipo_caso, 
			cs.estado, 
			cs.entidad_derivacion,
			cs.descripcion
		FROM caso_sensibles cs
		JOIN estudiantes e ON cs.estudiante_id = e.id
		WHERE e.cedula = ?
		ORDER BY cs.fecha_deteccion DESC;`

	if err := s.db.Raw(queryD, cedula).Scan(&ficha.CasosSensibles).Error; err != nil {
		return nil, fmt.Errorf("Error obteniendo casos sensibles: %v", err)
	}

	return ficha, nil
}

func (s *ReportService) ObtenerReporteEstadistico(fechaInicio, fechaFin string) (*dtos.ReporteEstadisticoDTO, error) {
	reporte := &dtos.ReporteEstadisticoDTO{
		FechaInicio: fechaInicio,
		FechaFin:    fechaFin,
	}

	queryA := `
		SELECT 
			tipo_caso,
			COUNT(*) as cantidad
		FROM caso_sensibles
		WHERE fecha_deteccion BETWEEN ? AND ?
		GROUP BY tipo_caso
		ORDER BY cantidad DESC;`

	if err := s.db.Raw(queryA, fechaInicio, fechaFin).Scan(&reporte.ConteoTipoCaso).Error; err != nil {
		return nil, fmt.Errorf("error en conteo por tipo de caso: %v", err)
	}

	queryB := `
		SELECT 
			ne.nombre || ' ' || c.paralelo as curso,
			COUNT(la.id) as total_faltas
		FROM llamado_atencions la
		JOIN matriculas m ON la.matricula_id = m.id
		JOIN cursos c ON m.curso_id = c.id
		JOIN nivel_educativos ne ON c.nivel_id = ne.id
		WHERE la.fecha BETWEEN ? AND ?
		GROUP BY c.id
		ORDER BY total_faltas DESC
		LIMIT 5;`

	if err := s.db.Raw(queryB, fechaInicio, fechaFin).Scan(&reporte.TopCursosConflictivos).Error; err != nil {
		return nil, fmt.Errorf("error en top cursos conflictivos: %v", err)
	}

	queryC := `
		SELECT 
			entidad_derivacion,
			COUNT(*) as cantidad
		FROM caso_sensibles
		WHERE fecha_deteccion BETWEEN ? AND ?
		AND entidad_derivacion IS NOT NULL 
		AND entidad_derivacion != ''
		GROUP BY entidad_derivacion;`

	if err := s.db.Raw(queryC, fechaInicio, fechaFin).Scan(&reporte.DerivacionesExternas).Error; err != nil {
		return nil, fmt.Errorf("error en derivaciones externas: %v", err)
	}

	return reporte, nil
}

func (s *ReportService) GenerarReporteEstadisticoPDF(fechaInicio, fechaFin string) (string, error) {
	data, err := s.ObtenerReporteEstadistico(fechaInicio, fechaFin)
	if err != nil {
		return "", err
	}

	cfg := config.NewBuilder().
		WithPageNumber().
		WithLeftMargin(15).
		WithTopMargin(15).
		WithRightMargin(15).
		Build()

	m := maroto.New(cfg)

	m.AddRow(12,
		text.NewCol(12, "REPORTE ESTADÍSTICO DE PROBLEMÁTICAS", props.Text{
			Size:  16,
			Style: fontstyle.Bold,
			Align: align.Center,
		}),
	)
	m.AddRow(8,
		text.NewCol(12, fmt.Sprintf("Desde: %s   Hasta: %s", fechaInicio, fechaFin), props.Text{
			Size:  10,
			Style: fontstyle.Italic,
			Align: align.Center,
		}),
	)
	m.AddRow(5)

	m.AddRow(10,
		text.NewCol(12, "A. Conteo por Tipo de Caso", props.Text{
			Size:  12,
			Style: fontstyle.Bold,
			Color: &props.Color{Red: 50, Green: 50, Blue: 50},
		}),
	)
	m.AddRow(1, text.NewCol(12, "__________________________________________________________________________________________________________", props.Text{Size: 6}))
	m.AddRow(5)

	m.AddRow(8,
		text.NewCol(8, "Tipo de Caso", props.Text{Style: fontstyle.Bold}),
		text.NewCol(4, "Cantidad", props.Text{Style: fontstyle.Bold, Align: align.Center}),
	)

	if len(data.ConteoTipoCaso) > 0 {
		for _, row := range data.ConteoTipoCaso {
			m.AddRow(6,
				text.NewCol(8, row.TipoCaso),
				text.NewCol(4, fmt.Sprintf("%d", row.Cantidad), props.Text{Align: align.Center}),
			)
			m.AddRow(1, text.NewCol(12, "- - - - - - - - - - - - - - - - - - - - - - - - - -", props.Text{Size: 2, Align: align.Center}))
		}
	} else {
		m.AddRow(6, text.NewCol(12, "Sin datos registrados", props.Text{Style: fontstyle.Italic}))
	}
	m.AddRow(10)

	m.AddRow(10,
		text.NewCol(12, "B. Top 5 Cursos con Mayor Conflictividad", props.Text{
			Size:  12,
			Style: fontstyle.Bold,
			Color: &props.Color{Red: 50, Green: 50, Blue: 50},
		}),
	)
	m.AddRow(1, text.NewCol(12, "__________________________________________________________________________________________________________", props.Text{Size: 6}))
	m.AddRow(5)

	m.AddRow(8,
		text.NewCol(8, "Curso / Paralelo", props.Text{Style: fontstyle.Bold}),
		text.NewCol(4, "Total Reportes Disciplinarios", props.Text{Style: fontstyle.Bold, Align: align.Center}),
	)

	if len(data.TopCursosConflictivos) > 0 {
		for _, row := range data.TopCursosConflictivos {
			m.AddRow(6,
				text.NewCol(8, row.Curso),
				text.NewCol(4, fmt.Sprintf("%d", row.TotalFaltas), props.Text{Align: align.Center}),
			)
			m.AddRow(1, text.NewCol(12, "- - - - - - - - - - - - - - - - - - - - - - - - - -", props.Text{Size: 2, Align: align.Center}))
		}
	} else {
		m.AddRow(6, text.NewCol(12, "Sin datos registrados", props.Text{Style: fontstyle.Italic}))
	}
	m.AddRow(10)

	m.AddRow(10,
		text.NewCol(12, "C. Derivaciones Externas Realizadas", props.Text{
			Size:  12,
			Style: fontstyle.Bold,
			Color: &props.Color{Red: 50, Green: 50, Blue: 50},
		}),
	)
	m.AddRow(1, text.NewCol(12, "__________________________________________________________________________________________________________", props.Text{Size: 6}))
	m.AddRow(5)

	m.AddRow(8,
		text.NewCol(8, "Entidad", props.Text{Style: fontstyle.Bold}),
		text.NewCol(4, "Cantidad", props.Text{Style: fontstyle.Bold, Align: align.Center}),
	)

	if len(data.DerivacionesExternas) > 0 {
		for _, row := range data.DerivacionesExternas {
			m.AddRow(6,
				text.NewCol(8, row.EntidadDerivacion),
				text.NewCol(4, fmt.Sprintf("%d", row.Cantidad), props.Text{Align: align.Center}),
			)
			m.AddRow(1, text.NewCol(12, "- - - - - - - - - - - - - - - - - - - - - - - - - -", props.Text{Size: 2, Align: align.Center}))
		}
	} else {
		m.AddRow(6, text.NewCol(12, "Sin derivaciones registradas", props.Text{Style: fontstyle.Italic}))
	}

	m.RegisterFooter(text.NewRow(10, fmt.Sprintf("Generado el: %s | DECE - Gestión Estudiantil", time.Now().Format("2006-01-02 15:04")), props.Text{
		Size:  8,
		Align: align.Center,
		Style: fontstyle.Italic,
		Color: &props.Color{Red: 100, Green: 100, Blue: 100},
	}))

	document, err := m.Generate()
	if err != nil {
		return "", err
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = "."
	}
	savePath := filepath.Join(homeDir, "Documents", "SistemaDECE", "Reportes")
	if err := os.MkdirAll(savePath, os.ModePerm); err != nil {
		return "", err
	}

	fileName := fmt.Sprintf("Reporte_Estadistico_%s_%s_%s.pdf", fechaInicio, fechaFin, time.Now().Format("150405"))
	fullPath := filepath.Join(savePath, fileName)

	err = document.Save(fullPath)
	if err != nil {
		return "", err
	}

	return fullPath, nil
}

func (s *ReportService) GenerarReporteFichaEstudiantil(cedula string) (string, error) {
	ficha, err := s.ObtenerDatosFichaEstudiantil(cedula)
	if err != nil {
		return "", err
	}

	cfg := config.NewBuilder().
		WithPageNumber().
		WithLeftMargin(15).
		WithTopMargin(15).
		WithRightMargin(15).
		Build()

	m := maroto.New(cfg)

	m.AddRow(12,
		text.NewCol(12, "FICHA ACUMULATIVA ESTUDIANTIL", props.Text{
			Size:  16,
			Style: fontstyle.Bold,
			Align: align.Center,
		}),
	)
	m.AddRow(10,
		text.NewCol(12, "Departamento de Consejería Estudiantil", props.Text{
			Size:  10,
			Style: fontstyle.Italic,
			Align: align.Center,
		}),
	)
	m.AddRow(5)

	m.AddRow(10,
		text.NewCol(12, "A. DATOS PERSONALES", props.Text{
			Size:  12,
			Style: fontstyle.Bold,
			Color: &props.Color{Red: 50, Green: 50, Blue: 50},
		}),
	)
	m.AddRow(1, text.NewCol(12, "__________________________________________________________________________________________________________", props.Text{Size: 6}))
	m.AddRow(5)

	m.AddRow(8,
		text.NewCol(2, "Estudiante:", props.Text{Style: fontstyle.Bold}),
		text.NewCol(6, fmt.Sprintf("%s %s", ficha.DatosPersonales.Apellidos, ficha.DatosPersonales.Nombres)),
		text.NewCol(2, "Cédula:", props.Text{Style: fontstyle.Bold}),
		text.NewCol(2, ficha.DatosPersonales.Cedula),
	)
	m.AddRow(8,
		text.NewCol(2, "F. Nacimiento:", props.Text{Style: fontstyle.Bold}),
		text.NewCol(6, ficha.DatosPersonales.FechaNacimiento), // Deberíamos calcular edad si fuese necesario
		text.NewCol(2, "Curso:", props.Text{Style: fontstyle.Bold}),
		text.NewCol(2, ficha.DatosPersonales.CursoActual),
	)
	m.AddRow(8,
		text.NewCol(2, "Dirección:", props.Text{Style: fontstyle.Bold}),
		text.NewCol(6, ficha.DatosPersonales.DireccionActual),
		text.NewCol(2, "Jornada:", props.Text{Style: fontstyle.Bold}),
		text.NewCol(2, ficha.DatosPersonales.Jornada),
	)
	m.AddRow(8,
		text.NewCol(2, "Email:", props.Text{Style: fontstyle.Bold}),
		text.NewCol(10, ficha.DatosPersonales.CorreoElectronico),
	)

	m.AddRow(10)

	m.AddRow(10,
		text.NewCol(12, "B. DATOS FAMILIARES", props.Text{
			Size:  12,
			Style: fontstyle.Bold,
			Color: &props.Color{Red: 50, Green: 50, Blue: 50},
		}),
	)
	m.AddRow(1, text.NewCol(12, "__________________________________________________________________________________________________________", props.Text{Size: 6}))
	m.AddRow(5)

	if len(ficha.Familiares) > 0 {
		for _, fam := range ficha.Familiares {
			repLegal := "No"
			if fam.EsRepresentanteLegal {
				repLegal = "Sí"
			}
			viveCon := "No"
			if fam.ViveConEstudiante {
				viveCon = "Sí"
			}

			m.AddRow(8,
				text.NewCol(12, fmt.Sprintf("• %s (%s)", fam.NombresCompletos, fam.Parentesco), props.Text{Style: fontstyle.Bold}),
			)
			m.AddRow(6,
				text.NewCol(3, "Teléfono:", props.Text{Style: fontstyle.Italic}),
				text.NewCol(3, fam.TelefonoPersonal),
				text.NewCol(3, "Representante:", props.Text{Style: fontstyle.Italic}),
				text.NewCol(3, repLegal),
			)
			m.AddRow(6,
				text.NewCol(3, "Vive con Est.:", props.Text{Style: fontstyle.Italic}),
				text.NewCol(9, viveCon),
			)
			m.AddRow(2)
		}
	} else {
		m.AddRow(8, text.NewCol(12, "No se registraron datos familiares.", props.Text{Style: fontstyle.Italic}))
	}

	m.AddRow(10)

	m.AddRow(10,
		text.NewCol(12, "C. HISTORIAL DISCIPLINARIO", props.Text{
			Size:  12,
			Style: fontstyle.Bold,
			Color: &props.Color{Red: 50, Green: 50, Blue: 50},
		}),
	)
	m.AddRow(1, text.NewCol(12, "__________________________________________________________________________________________________________", props.Text{Size: 6}))
	m.AddRow(5)

	if len(ficha.Disciplina) > 0 {
		for _, disc := range ficha.Disciplina {
			m.AddRow(8,
				text.NewCol(2, disc.Fecha, props.Text{Style: fontstyle.Bold}),
				text.NewCol(10, fmt.Sprintf("%s (%s)", disc.Motivo, disc.PeriodoLectivo), props.Text{Style: fontstyle.Bold}),
			)
			m.AddRow(12,
				text.NewCol(2, "Detalle:", props.Text{Style: fontstyle.Italic}),
				text.NewCol(10, disc.DetalleSancion),
			)
			m.AddRow(6,
				text.NewCol(2, "Estado:", props.Text{Style: fontstyle.Italic}),
				text.NewCol(10, disc.Estado),
			)
			m.AddRow(4, text.NewCol(12, "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -", props.Text{Size: 6, Align: align.Center}))
		}
	} else {
		m.AddRow(8, text.NewCol(12, "No hay registros disciplinarios.", props.Text{Style: fontstyle.Italic}))
	}

	m.AddRow(10)

	m.AddRow(10,
		text.NewCol(12, "D. CASOS SENSIBLES (Seguimiento DECE)", props.Text{
			Size:  12,
			Style: fontstyle.Bold,
			Color: &props.Color{Red: 50, Green: 50, Blue: 50},
		}),
	)
	m.AddRow(1, text.NewCol(12, "__________________________________________________________________________________________________________", props.Text{Size: 6}))
	m.AddRow(5)

	if len(ficha.CasosSensibles) > 0 {
		for _, caso := range ficha.CasosSensibles {
			m.AddRow(8,
				text.NewCol(3, fmt.Sprintf("Caso #%s", caso.CodigoCaso), props.Text{Style: fontstyle.Bold}),
				text.NewCol(3, caso.FechaDeteccion),
				text.NewCol(6, caso.TipoCaso, props.Text{Style: fontstyle.Bold}),
			)
			m.AddRow(12,
				text.NewCol(12, caso.Descripcion),
			)
			m.AddRow(6,
				text.NewCol(3, "Estado:", props.Text{Style: fontstyle.Italic}),
				text.NewCol(3, caso.Estado),
				text.NewCol(3, "Derivado a:", props.Text{Style: fontstyle.Italic}),
				text.NewCol(3, caso.EntidadDerivacion),
			)
			m.AddRow(4, text.NewCol(12, "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -", props.Text{Size: 6, Align: align.Center}))
		}
	} else {
		m.AddRow(8, text.NewCol(12, "No se registran casos sensibles.", props.Text{Style: fontstyle.Italic}))
	}

	m.RegisterFooter(text.NewRow(10, fmt.Sprintf("Generado el: %s | DECE - Gestión Estudiantil", time.Now().Format("2006-01-02 15:04")), props.Text{
		Size:  8,
		Align: align.Center,
		Style: fontstyle.Italic,
		Color: &props.Color{Red: 100, Green: 100, Blue: 100},
	}))

	document, err := m.Generate()
	if err != nil {
		return "", err
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = "."
	}
	savePath := filepath.Join(homeDir, "Documents", "SistemaDECE", "Reportes")
	if err := os.MkdirAll(savePath, os.ModePerm); err != nil {
		return "", err
	}

	fileName := fmt.Sprintf("Ficha_%s_%s.pdf", ficha.DatosPersonales.Cedula, time.Now().Format("20060102_150405"))
	fullPath := filepath.Join(savePath, fileName)

	err = document.Save(fullPath)
	if err != nil {
		return "", err
	}

	return fullPath, nil
}

func (s *ReportService) ObtenerReporteNominaVulnerabilidad(filtroTipoCaso string) ([]dtos.NominaVulnerabilidadDTO, error) {
	var reporte []dtos.NominaVulnerabilidadDTO

	param := "%" + filtroTipoCaso + "%"

	query := `
		SELECT 
			e.cedula,
			e.apellidos || ' ' || e.nombres as estudiante,
			ne.nombre || ' ' || c.paralelo as curso,
			cs.tipo_caso,
			cs.codigo_caso,
			cs.estado,
			cs.fecha_deteccion
		FROM caso_sensibles cs
		JOIN estudiantes e ON cs.estudiante_id = e.id
		JOIN periodo_lectivos pl ON cs.periodo_id = pl.id
		LEFT JOIN matriculas m ON e.id = m.estudiante_id 
		LEFT JOIN cursos c ON m.curso_id = c.id
		LEFT JOIN nivel_educativos ne ON c.nivel_id = ne.id
		WHERE pl.es_activo = 1  
		AND m.estado = 'Matriculado'
		AND cs.tipo_caso LIKE ? 
		ORDER BY c.nivel_id, c.paralelo, e.apellidos;`

	if err := s.db.Raw(query, param).Scan(&reporte).Error; err != nil {
		return nil, fmt.Errorf("error obteniendo nómina de vulnerabilidad: %v", err)
	}

	return reporte, nil
}

func (s *ReportService) GenerarReporteNominaVulnerabilidadPDF(filtroTipoCaso string) (string, error) {
	data, err := s.ObtenerReporteNominaVulnerabilidad(filtroTipoCaso)
	if err != nil {
		return "", err
	}

	tituloFiltro := "TODOS"
	if filtroTipoCaso != "" {
		tituloFiltro = fmt.Sprintf("COINCIDENCIA: '%s'", filtroTipoCaso)
	}

	cfg := config.NewBuilder().
		WithPageNumber().
		WithLeftMargin(15).
		WithTopMargin(15).
		WithRightMargin(15).
		Build()

	m := maroto.New(cfg)

	m.AddRow(12,
		text.NewCol(12, "REPORTE DE VULNERABILIDAD / NEE", props.Text{
			Size:  16,
			Style: fontstyle.Bold,
			Align: align.Center,
		}),
	)
	m.AddRow(8,
		text.NewCol(12, fmt.Sprintf("Filtro Aplicado: %s", tituloFiltro), props.Text{
			Size:  10,
			Style: fontstyle.Italic,
			Align: align.Center,
		}),
	)
	m.AddRow(5)

	m.AddRow(1, text.NewCol(12, "__________________________________________________________________________________________________________", props.Text{Size: 6}))
	m.AddRow(5)

	m.AddRow(8,
		text.NewCol(3, "Estudiante (Cédula)", props.Text{Style: fontstyle.Bold, Size: 9}),
		text.NewCol(2, "Curso", props.Text{Style: fontstyle.Bold, Size: 9}),
		text.NewCol(2, "Cod. Caso", props.Text{Style: fontstyle.Bold, Size: 9}),
		text.NewCol(3, "Tipo de Caso", props.Text{Style: fontstyle.Bold, Size: 9}),
		text.NewCol(2, "Estado", props.Text{Style: fontstyle.Bold, Size: 9}),
	)

	if len(data) > 0 {
		for _, row := range data {
			m.AddRow(10,
				text.NewCol(3, fmt.Sprintf("%s\n%s", row.Estudiante, row.Cedula), props.Text{Size: 8}),
				text.NewCol(2, row.Curso, props.Text{Size: 8}),
				text.NewCol(2, row.CodigoCaso, props.Text{Size: 8}),
				text.NewCol(3, row.TipoCaso, props.Text{Size: 8}),
				text.NewCol(2, row.Estado, props.Text{Size: 8}),
			)
			m.AddRow(2, text.NewCol(12, "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -", props.Text{Size: 2, Align: align.Center, Color: &props.Color{Red: 200, Green: 200, Blue: 200}}))
		}
	} else {
		m.AddRow(10, text.NewCol(12, "No se encontraron registros.", props.Text{Style: fontstyle.Italic, Align: align.Center}))
	}

	m.RegisterFooter(text.NewRow(10, fmt.Sprintf("Generado el: %s | DECE - Gestión Estudiantil", time.Now().Format("2006-01-02 15:04")), props.Text{
		Size:  8,
		Align: align.Center,
		Style: fontstyle.Italic,
		Color: &props.Color{Red: 100, Green: 100, Blue: 100},
	}))

	document, err := m.Generate()
	if err != nil {
		return "", err
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = "."
	}
	savePath := filepath.Join(homeDir, "Documents", "SistemaDECE", "Reportes")
	if err := os.MkdirAll(savePath, os.ModePerm); err != nil {
		return "", err
	}

	fileName := fmt.Sprintf("Nomina_NEE_%s.pdf", time.Now().Format("20060102_150405"))
	fullPath := filepath.Join(savePath, fileName)

	err = document.Save(fullPath)
	if err != nil {
		return "", err
	}

	return fullPath, nil
}

func (s *ReportService) ObtenerReporteBitacoraGestion(fechaInicio, fechaFin string) (*dtos.BitacoraGestionDTO, error) {
	reporte := &dtos.BitacoraGestionDTO{
		Talleres: []dtos.BitacoraTallerDTO{},
	}

	queryA := `
	SELECT
		(SELECT COUNT(*) FROM convocatoria 
		 WHERE fecha_cita BETWEEN ? AND ? AND cita_completada = 1) as citas_realizadas,
		 
		(SELECT COUNT(*) FROM capacitacions 
		 WHERE fecha BETWEEN ? AND ?) as talleres_dictados,
		 
		(SELECT COALESCE(SUM(cantidad), 0) FROM (
			SELECT json_extract(detalle_audiencia, '$.cantidad_beneficiarios') as cantidad
			FROM capacitacions 
			WHERE fecha BETWEEN ? AND ?
		 )) as personas_capacitadas;`

	if err := s.db.Raw(queryA, fechaInicio, fechaFin, fechaInicio, fechaFin, fechaInicio, fechaFin).Scan(&reporte.KPIs).Error; err != nil {
		return nil, fmt.Errorf("error obteniendo KPIs bitácora: %v", err)
	}

	queryB := `
	SELECT 
		fecha,
		tema,
		json_extract(detalle_audiencia, '$.grupo_objetivo') as grupo,
		json_extract(detalle_audiencia, '$.cantidad_beneficiarios') as asistentes
	FROM capacitacions
	WHERE fecha BETWEEN ? AND ?
	ORDER BY fecha DESC;`

	if err := s.db.Raw(queryB, fechaInicio, fechaFin).Scan(&reporte.Talleres).Error; err != nil {
		return nil, fmt.Errorf("error obteniendo detalle capacitaciones: %v", err)
	}

	return reporte, nil
}

func (s *ReportService) GenerarReporteBitacoraGestionPDF(fechaInicio, fechaFin string) (string, error) {
	data, err := s.ObtenerReporteBitacoraGestion(fechaInicio, fechaFin)
	if err != nil {
		return "", err
	}

	cfg := config.NewBuilder().
		WithPageNumber().
		WithLeftMargin(15).
		WithTopMargin(15).
		WithRightMargin(15).
		Build()

	m := maroto.New(cfg)

	m.AddRow(12,
		text.NewCol(12, "BITÁCORA DE GESTIÓN DECE", props.Text{
			Size:  16,
			Style: fontstyle.Bold,
			Align: align.Center,
		}),
	)
	m.AddRow(8,
		text.NewCol(12, fmt.Sprintf("Periodo: %s - %s", fechaInicio, fechaFin), props.Text{
			Size:  10,
			Style: fontstyle.Italic,
			Align: align.Center,
		}),
	)
	m.AddRow(5)

	m.AddRow(1, text.NewCol(12, "__________________________________________________________________________________________________________", props.Text{Size: 6}))
	m.AddRow(5)

	m.AddRow(10, text.NewCol(12, "A. RESUMEN EJECUTIVO (KPIs)", props.Text{Style: fontstyle.Bold, Size: 11, Color: &props.Color{Red: 0, Green: 50, Blue: 150}}))

	m.AddRow(20,
		text.NewCol(4, fmt.Sprintf("Citas Realizadas\n\n%d", data.KPIs.CitasRealizadas), props.Text{
			Size: 10, Align: align.Center, Style: fontstyle.Bold,
		}),
		text.NewCol(4, fmt.Sprintf("Talleres Dictados\n\n%d", data.KPIs.TalleresDictados), props.Text{
			Size: 10, Align: align.Center, Style: fontstyle.Bold,
		}),
		text.NewCol(4, fmt.Sprintf("Personas Capacitadas\n\n%d", data.KPIs.PersonasCapacitadas), props.Text{
			Size: 10, Align: align.Center, Style: fontstyle.Bold,
		}),
	)
	m.AddRow(10)

	m.AddRow(10, text.NewCol(12, "B. DETALLE DE TALLERES IMPARTIDOS", props.Text{Style: fontstyle.Bold, Size: 11, Color: &props.Color{Red: 0, Green: 50, Blue: 150}}))

	m.AddRow(8,
		text.NewCol(2, "Fecha", props.Text{Style: fontstyle.Bold, Size: 9}),
		text.NewCol(5, "Tema", props.Text{Style: fontstyle.Bold, Size: 9}),
		text.NewCol(3, "Grupo Objetivo", props.Text{Style: fontstyle.Bold, Size: 9}),
		text.NewCol(2, "Asistentes", props.Text{Style: fontstyle.Bold, Size: 9, Align: align.Center}),
	)

	if len(data.Talleres) > 0 {
		for _, row := range data.Talleres {
			m.AddRow(10,
				text.NewCol(2, row.Fecha, props.Text{Size: 8}),
				text.NewCol(5, row.Tema, props.Text{Size: 8}),
				text.NewCol(3, row.Grupo, props.Text{Size: 8}),
				text.NewCol(2, fmt.Sprintf("%d", row.Asistentes), props.Text{Size: 8, Align: align.Center}),
			)
			m.AddRow(2, text.NewCol(12, "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -", props.Text{Size: 2, Align: align.Center, Color: &props.Color{Red: 200, Green: 200, Blue: 200}}))
		}
	} else {
		m.AddRow(10, text.NewCol(12, "No se encontraron registros de talleres en este periodo.", props.Text{Style: fontstyle.Italic, Align: align.Center}))
	}

	m.RegisterFooter(text.NewRow(10, fmt.Sprintf("Generado el: %s | DECE - Gestión Estudiantil", time.Now().Format("2006-01-02 15:04")), props.Text{
		Size:  8,
		Align: align.Center,
		Style: fontstyle.Italic,
		Color: &props.Color{Red: 100, Green: 100, Blue: 100},
	}))

	document, err := m.Generate()
	if err != nil {
		return "", err
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = "."
	}
	savePath := filepath.Join(homeDir, "Documents", "SistemaDECE", "Reportes")
	if err := os.MkdirAll(savePath, os.ModePerm); err != nil {
		return "", err
	}

	fileName := fmt.Sprintf("Bitacora_Gestion_%s.pdf", time.Now().Format("20060102_150405"))
	fullPath := filepath.Join(savePath, fileName)

	err = document.Save(fullPath)
	if err != nil {
		return "", err
	}

	return fullPath, nil
}

func (s *ReportService) ObtenerReporteDerivaciones(fechaInicio, fechaFin string) ([]dtos.DerivacionDTO, error) {
	var derivaciones []dtos.DerivacionDTO

	query := `
	SELECT 
		cs.codigo_caso,
		cs.fecha_deteccion,
		e.cedula,
		e.apellidos || ' ' || e.nombres as estudiante,
		ne.nombre || ' ' || c.paralelo as curso,
		cs.tipo_caso,
		cs.entidad_derivacion,
		cs.estado
	FROM caso_sensibles cs
	JOIN estudiantes e ON cs.estudiante_id = e.id
	JOIN periodo_lectivos pl ON cs.periodo_id = pl.id
	-- Joins para obtener el curso actual del estudiante
	LEFT JOIN matriculas m ON e.id = m.estudiante_id 
	LEFT JOIN cursos c ON m.curso_id = c.id
	LEFT JOIN nivel_educativos ne ON c.nivel_id = ne.id
	WHERE pl.es_activo = 1 
	AND m.estado = 'Matriculado'
	-- FILTRO CLAVE: Solo aquellos que tienen una entidad de derivación registrada
	AND cs.entidad_derivacion IS NOT NULL 
	AND cs.entidad_derivacion != ''
	AND cs.fecha_deteccion BETWEEN ? AND ?
	ORDER BY cs.fecha_deteccion DESC;`

	if err := s.db.Raw(query, fechaInicio, fechaFin).Scan(&derivaciones).Error; err != nil {
		return nil, fmt.Errorf("error obteniendo derivaciones: %v", err)
	}

	return derivaciones, nil
}

func (s *ReportService) GenerarReporteDerivacionesPDF(fechaInicio, fechaFin string) (string, error) {
	data, err := s.ObtenerReporteDerivaciones(fechaInicio, fechaFin)
	if err != nil {
		return "", err
	}

	cfg := config.NewBuilder().
		WithPageNumber().
		WithLeftMargin(15).
		WithTopMargin(15).
		WithRightMargin(15).
		Build()

	m := maroto.New(cfg)

	m.AddRow(12,
		text.NewCol(12, "ARTICULACIÓN INTERINSTITUCIONAL (DERIVACIONES)", props.Text{
			Size:  14,
			Style: fontstyle.Bold,
			Align: align.Center,
			Color: &props.Color{Red: 0, Green: 102, Blue: 204},
		}),
	)
	m.AddRow(8,
		text.NewCol(12, fmt.Sprintf("Periodo: %s - %s", fechaInicio, fechaFin), props.Text{
			Size:  10,
			Style: fontstyle.Italic,
			Align: align.Center,
		}),
	)
	m.AddRow(5)

	m.AddRow(1, text.NewCol(12, "__________________________________________________________________________________________________________", props.Text{Size: 6}))
	m.AddRow(5)

	m.AddRow(10,
		text.NewCol(2, "Fecha", props.Text{Style: fontstyle.Bold, Size: 8}),
		text.NewCol(3, "Estudiante", props.Text{Style: fontstyle.Bold, Size: 8}),
		text.NewCol(2, "Curso", props.Text{Style: fontstyle.Bold, Size: 8}),
		text.NewCol(2, "Entidad", props.Text{Style: fontstyle.Bold, Size: 8}),
		text.NewCol(2, "Tipo Caso", props.Text{Style: fontstyle.Bold, Size: 8}),
		text.NewCol(1, "Estado", props.Text{Style: fontstyle.Bold, Size: 8}),
	)

	if len(data) > 0 {
		for _, row := range data {
			m.AddRow(12,
				text.NewCol(2, row.FechaDeteccion, props.Text{Size: 8}),
				text.NewCol(3, fmt.Sprintf("%s\n%s", row.Estudiante, row.Cedula), props.Text{Size: 7}),
				text.NewCol(2, row.Curso, props.Text{Size: 7}),
				text.NewCol(2, row.EntidadDerivacion, props.Text{Size: 7, Style: fontstyle.Bold}),
				text.NewCol(2, row.TipoCaso, props.Text{Size: 7}),
				text.NewCol(1, row.Estado, props.Text{Size: 7}),
			)
			m.AddRow(2, text.NewCol(12, "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -", props.Text{Size: 2, Align: align.Center, Color: &props.Color{Red: 200, Green: 200, Blue: 200}}))
		}
	} else {
		m.AddRow(10, text.NewCol(12, "No se encontraron derivaciones en este periodo.", props.Text{Style: fontstyle.Italic, Align: align.Center}))
	}

	m.RegisterFooter(text.NewRow(10, fmt.Sprintf("Generado el: %s | DECE - Gestión Estudiantil", time.Now().Format("2006-01-02 15:04")), props.Text{
		Size:  8,
		Align: align.Center,
		Style: fontstyle.Italic,
		Color: &props.Color{Red: 100, Green: 100, Blue: 100},
	}))

	document, err := m.Generate()
	if err != nil {
		return "", err
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = "."
	}
	savePath := filepath.Join(homeDir, "Documents", "SistemaDECE", "Reportes")
	if err := os.MkdirAll(savePath, os.ModePerm); err != nil {
		return "", err
	}

	fileName := fmt.Sprintf("Derivaciones_%s.pdf", time.Now().Format("20060102_150405"))
	fullPath := filepath.Join(savePath, fileName)

	err = document.Save(fullPath)
	if err != nil {
		return "", err
	}

	return fullPath, nil
}
