package services

import (
	"context"
	dto "dece/internal/application/dtos/management"
	"dece/internal/domain/academic"
	"dece/internal/domain/common"
	"dece/internal/domain/faculty"
	"dece/internal/domain/management"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gorm.io/gorm"
)

type ManagementService struct {
	db  *gorm.DB
	ctx context.Context
}

func NewManagementService(db *gorm.DB) *ManagementService {
	return &ManagementService{db: db}
}

func (s *ManagementService) Startup(ctx context.Context) {
	s.ctx = ctx
}

// =============================================================================
// AGENDAR CITA
// =============================================================================
func (s *ManagementService) AgendarCita(input dto.AgendarCitaDTO) (*management.Convocatoria, error) {
	// 1. Validar que la fecha no sea en el pasado
	// Formato esperado: YYYY-MM-DD HH:mm (HTML datetime-local input)
	layout := "2006-01-02 15:04"
	fechaParsed, err := time.Parse(layout, input.FechaCita)

	if err == nil {
		// Solo validamos si el parseo fue exitoso.
		// Si la fecha es anterior a "ahora" (con un margen de 5 min por latencia), error.
		if fechaParsed.Before(time.Now().Add(-5 * time.Minute)) {
			return nil, errors.New("no se puede agendar una cita en el pasado")
		}
	}

	// 2. Crear Modelo
	cita := management.Convocatoria{
		MatriculaID:    input.MatriculaID,
		Entidad:        input.Entidad,
		Motivo:         input.Motivo,
		FechaCita:      input.FechaCita,
		DiasAlerta:     input.DiasAlerta,
		CitaCompletada: false, // Por defecto pendiente
	}

	// 3. Guardar
	if err := s.db.Create(&cita).Error; err != nil {
		return nil, fmt.Errorf("error al agendar cita: %v", err)
	}

	return &cita, nil
}

// =============================================================================
// LISTAR CITAS (CON FILTROS Y PRELOAD)
// =============================================================================
func (s *ManagementService) ListarCitas(filtro dto.FiltroCitasDTO) ([]dto.CitaResumenDTO, error) {
	var citas []management.Convocatoria

	// Query Base con Joins necesarios para obtener nombres
	query := s.db.Model(&management.Convocatoria{}).
		Preload("Matricula.Estudiante").
		Preload("Matricula.Curso.Nivel"). // Asumiendo estructura académica
		Order("fecha_cita ASC")           // Las más próximas primero

	// Aplicar Filtros
	if filtro.Tipo == "pendientes" {
		query = query.Where("cita_completada = ?", false)
	} else if filtro.Tipo == "rango" && filtro.FechaSolo != "" {
		// Filtro simple por día (LIKE '2025-10-20%')
		query = query.Where("fecha_cita LIKE ?", filtro.FechaSolo+"%")
	}

	// Ejecutar consulta
	if err := query.Find(&citas).Error; err != nil {
		return nil, err
	}

	// Mapear a DTO Plano
	response := make([]dto.CitaResumenDTO, len(citas))
	layout := "2006-01-02 15:04"
	now := time.Now()

	for i, c := range citas {
		// Construir nombre estudiante y descripción real del curso (si están preloadados)
		nombreEst := "Desconocido"
		cursoStr := "S/C"
		if c.Matricula.ID != 0 {
			// Nombre del estudiante (si existe)
			if c.Matricula.Estudiante.ID != 0 {
				nombreEst = fmt.Sprintf("%s %s", c.Matricula.Estudiante.Apellidos, c.Matricula.Estudiante.Nombres)
			}

			// Construir descripción del curso usando Nivel.Nombre (o NombreCompleto), Paralelo y Jornada si están disponibles
			parts := make([]string, 0, 3)
			if c.Matricula.Curso.Nivel.ID != 0 {
				nivel := c.Matricula.Curso.Nivel.NombreCompleto
				if strings.TrimSpace(nivel) == "" {
					nivel = c.Matricula.Curso.Nivel.Nombre
				}
				if strings.TrimSpace(nivel) != "" {
					parts = append(parts, nivel)
				}
			}
			if strings.TrimSpace(c.Matricula.Curso.Paralelo) != "" {
				parts = append(parts, c.Matricula.Curso.Paralelo)
			}
			if strings.TrimSpace(c.Matricula.Curso.Jornada) != "" {
				parts = append(parts, c.Matricula.Curso.Jornada)
			}

			if len(parts) > 0 {
				cursoStr = strings.Join(parts, " ")
			}
		}

		// Calcular Alerta Visual
		// Si falta menos de X días y no está completada -> Alerta True
		esAlerta := false
		if !c.CitaCompletada {
			fechaCita, _ := time.Parse(layout, c.FechaCita)
			// Si la fecha de la cita - dias de alerta < ahora, entonces estamos en zona de alerta
			fechaAviso := fechaCita.AddDate(0, 0, -c.DiasAlerta)
			if now.After(fechaAviso) && now.Before(fechaCita) {
				esAlerta = true
			}
		}

		response[i] = dto.CitaResumenDTO{
			ID:               c.ID,
			FechaHora:        c.FechaCita,
			Entidad:          c.Entidad,
			Motivo:           c.Motivo,
			EstudianteNombre: nombreEst,
			Curso:            cursoStr,
			Completada:       c.CitaCompletada,
			Alerta:           esAlerta,
		}
	}

	return response, nil
}

// =============================================================================
// MARCAR COMPLETADA (CHECK)
// =============================================================================
func (s *ManagementService) MarcarCompletada(id uint, completada bool) error {
	result := s.db.Model(&management.Convocatoria{}).
		Where("id = ?", id).
		Update("cita_completada", completada)

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("cita no encontrada")
	}
	return nil
}

// =============================================================================
// ELIMINAR CITA
// =============================================================================
func (s *ManagementService) EliminarCita(id uint) error {
	return s.db.Delete(&management.Convocatoria{}, id).Error
}

// =============================================================================
// OBTENER CITA (DETALLE)
// =============================================================================
func (s *ManagementService) ObtenerCita(id uint) (*dto.CitaDetalleDTO, error) {
	var cita management.Convocatoria

	if err := s.db.
		Preload("Matricula.Estudiante").
		Preload("Matricula.Curso.Nivel").
		First(&cita, id).Error; err != nil {
		return nil, errors.New("cita no encontrada")
	}

	nombres := ""
	apellidos := ""
	nombreCompleto := "Desconocido"
	cursoStr := "S/C"

	if cita.Matricula.ID != 0 {
		if cita.Matricula.Estudiante.ID != 0 {
			nombres = cita.Matricula.Estudiante.Nombres
			apellidos = cita.Matricula.Estudiante.Apellidos
			nombreCompleto = fmt.Sprintf("%s %s", apellidos, nombres)
		}

		parts := make([]string, 0, 3)
		if cita.Matricula.Curso.Nivel.ID != 0 {
			nivel := cita.Matricula.Curso.Nivel.NombreCompleto
			if strings.TrimSpace(nivel) == "" {
				nivel = cita.Matricula.Curso.Nivel.Nombre
			}
			if strings.TrimSpace(nivel) != "" {
				parts = append(parts, nivel)
			}
		}
		if strings.TrimSpace(cita.Matricula.Curso.Paralelo) != "" {
			parts = append(parts, cita.Matricula.Curso.Paralelo)
		}
		if strings.TrimSpace(cita.Matricula.Curso.Jornada) != "" {
			parts = append(parts, cita.Matricula.Curso.Jornada)
		}
		if len(parts) > 0 {
			cursoStr = strings.Join(parts, " ")
		}
	}

	return &dto.CitaDetalleDTO{
		ID:             cita.ID,
		MatriculaID:    cita.MatriculaID,
		Entidad:        cita.Entidad,
		Motivo:         cita.Motivo,
		FechaCita:      cita.FechaCita,
		DiasAlerta:     cita.DiasAlerta,
		Completada:     cita.CitaCompletada,
		Curso:          cursoStr,
		Nombres:        nombres,
		Apellidos:      apellidos,
		NombreCompleto: nombreCompleto,
	}, nil
}

// =============================================================================
// ACTUALIZAR CITA
// =============================================================================
func (s *ManagementService) ActualizarCita(input dto.ActualizarCitaDTO) (*management.Convocatoria, error) {
	// 1. Validar que la fecha no sea en el pasado
	layout := "2006-01-02 15:04"
	fechaParsed, err := time.Parse(layout, input.FechaCita)
	if err == nil {
		if fechaParsed.Before(time.Now().Add(-5 * time.Minute)) {
			return nil, errors.New("no se puede agendar una cita en el pasado")
		}
	}

	// 2. Buscar cita existente
	var cita management.Convocatoria
	if err := s.db.First(&cita, input.ID).Error; err != nil {
		return nil, errors.New("cita no encontrada")
	}

	// 3. Actualizar campos editables
	cita.MatriculaID = input.MatriculaID
	cita.Entidad = input.Entidad
	cita.Motivo = input.Motivo
	cita.FechaCita = input.FechaCita
	cita.DiasAlerta = input.DiasAlerta

	if err := s.db.Save(&cita).Error; err != nil {
		return nil, fmt.Errorf("error al actualizar cita: %v", err)
	}

	return &cita, nil
}

// Training

func (s *ManagementService) ListarCapacitaciones() ([]dto.CapacitacionResumenDTO, error) {
	var capacitaciones []management.Capacitacion

	// 1. Obtener Periodo Activo
	var periodoActivo academic.PeriodoLectivo
	if err := s.db.Where("es_activo = ?", true).First(&periodoActivo).Error; err != nil {
		// Si no hay periodo activo, retornamos lista vacía o error según prefieras
		return []dto.CapacitacionResumenDTO{}, nil
	}

	// 2. Buscar capacitaciones de este periodo
	result := s.db.Where("periodo_id = ?", periodoActivo.ID).
		Order("fecha DESC").
		Find(&capacitaciones)

	if result.Error != nil {
		return nil, result.Error
	}

	// 3. Mapear respuesta
	response := make([]dto.CapacitacionResumenDTO, len(capacitaciones))
	for i, c := range capacitaciones {
		detalles := c.DetalleAudiencia.Data

		response[i] = dto.CapacitacionResumenDTO{
			ID:                    c.ID,
			Fecha:                 c.Fecha,
			Tema:                  c.Tema,
			GrupoObjetivo:         detalles.GrupoObjetivo,
			CantidadBeneficiarios: detalles.CantidadBeneficiarios,
			TieneEvidencia:        c.RutaEvidencia != "",
			RutaEvidencia:         c.RutaEvidencia,
		}
	}

	return response, nil
}

// ObtenerCapacitacion devuelve el detalle completo para editar.
func (s *ManagementService) ObtenerCapacitacion(id uint) (*dto.GuardarCapacitacionDTO, error) {
	var c management.Capacitacion
	if err := s.db.First(&c, id).Error; err != nil {
		return nil, errors.New("capacitación no encontrada")
	}

	detalles := c.DetalleAudiencia.Data

	return &dto.GuardarCapacitacionDTO{
		ID:                    c.ID,
		Tema:                  c.Tema,
		Fecha:                 c.Fecha,
		GrupoObjetivo:         detalles.GrupoObjetivo,
		JornadaDocentes:       detalles.JornadaDocentes,
		CursoID:               detalles.CursoID,
		GradoEspecifico:       detalles.GradoEspecifico,
		ParaleloEspecifico:    detalles.ParaleloEspecifico,
		CantidadBeneficiarios: detalles.CantidadBeneficiarios,
	}, nil
}

// RegistrarCapacitacion crea o actualiza un taller empaquetando los detalles en JSON.
func (s *ManagementService) RegistrarCapacitacion(input dto.GuardarCapacitacionDTO) (*management.Capacitacion, error) {
	var capacitacion management.Capacitacion
	var rutaEvidenciaPrevia string

	// Periodo activo (para validar el curso seleccionado)
	var periodoActivo academic.PeriodoLectivo
	if err := s.db.Where("es_activo = ?", true).First(&periodoActivo).Error; err != nil {
		return nil, errors.New("debe configurar un periodo lectivo activo antes de registrar capacitaciones")
	}

	// Validar que el curso seleccionado pertenezca al periodo activo
	var cursoSeleccionado faculty.Curso
	if input.CursoID > 0 {
		if err := s.db.Preload("Nivel").
			Where("id = ? AND periodo_id = ?", input.CursoID, periodoActivo.ID).
			First(&cursoSeleccionado).Error; err != nil {
			return nil, errors.New("el aula seleccionada no pertenece al periodo lectivo activo")
		}
	}

	// A. Construir el objeto JSON Audiencia
	audiencia := management.AudienciaCapacitacion{
		GrupoObjetivo:         input.GrupoObjetivo,
		JornadaDocentes:       input.JornadaDocentes,
		CursoID:               input.CursoID,
		GradoEspecifico:       input.GradoEspecifico,
		ParaleloEspecifico:    input.ParaleloEspecifico,
		CantidadBeneficiarios: input.CantidadBeneficiarios,
	}

	// Si se seleccionó un curso, completamos grado/paralelo de forma consistente
	if input.CursoID > 0 {
		nivel := strings.TrimSpace(cursoSeleccionado.Nivel.NombreCompleto)
		if nivel == "" {
			nivel = strings.TrimSpace(cursoSeleccionado.Nivel.Nombre)
		}
		audiencia.GradoEspecifico = nivel
		paralelo := strings.TrimSpace(cursoSeleccionado.Paralelo)
		jornada := strings.TrimSpace(cursoSeleccionado.Jornada)
		suffix := strings.TrimSpace(strings.Join([]string{paralelo, jornada}, " "))
		audiencia.ParaleloEspecifico = suffix
	}

	// B. Lógica Crear vs Editar
	if input.ID > 0 {
		// EDICIÓN
		if err := s.db.First(&capacitacion, input.ID).Error; err != nil {
			return nil, errors.New("registro no encontrado para editar")
		}
		rutaEvidenciaPrevia = capacitacion.RutaEvidencia // Mantenemos la ruta si ya existía
	} else {
		// CREACIÓN: asignar periodo activo
		capacitacion.PeriodoID = periodoActivo.ID
		capacitacion.RutaEvidencia = "" // Nueva, sin evidencia aún
	}

	// C. Asignar campos
	capacitacion.Tema = input.Tema
	// Permite recibir fecha con hora desde el frontend (YYYY-MM-DDTHH:mm)
	capacitacion.Fecha = strings.Replace(input.Fecha, "T", " ", 1)

	// Empaquetamos el struct en el wrapper JSONMap
	capacitacion.DetalleAudiencia = common.JSONMap[management.AudienciaCapacitacion]{
		Data: audiencia,
	}

	// Si era edición, restauramos la ruta (el JSONMap sobreescribe todo el struct si no se cuida,
	// pero aquí asignamos campo por campo, así que GORM maneja la ruta aparte)
	if input.ID > 0 {
		capacitacion.RutaEvidencia = rutaEvidenciaPrevia
	}

	// D. Guardar
	if err := s.db.Save(&capacitacion).Error; err != nil {
		return nil, fmt.Errorf("error al guardar capacitación: %v", err)
	}

	return &capacitacion, nil
}

// ListarAulasPeriodoActivo devuelve los cursos (aulas) del periodo lectivo activo.
func (s *ManagementService) ListarAulasPeriodoActivo() ([]dto.AulaDTO, error) {
	var periodoActivo academic.PeriodoLectivo
	if err := s.db.Where("es_activo = ?", true).First(&periodoActivo).Error; err != nil {
		return []dto.AulaDTO{}, nil
	}

	var cursos []faculty.Curso
	if err := s.db.
		Preload("Nivel").
		Where("periodo_id = ?", periodoActivo.ID).
		Order("nivel_id ASC, paralelo ASC, jornada ASC").
		Find(&cursos).Error; err != nil {
		return nil, err
	}

	resp := make([]dto.AulaDTO, 0, len(cursos))
	for _, c := range cursos {
		nivel := strings.TrimSpace(c.Nivel.NombreCompleto)
		if nivel == "" {
			nivel = strings.TrimSpace(c.Nivel.Nombre)
		}
		parts := make([]string, 0, 3)
		if nivel != "" {
			parts = append(parts, nivel)
		}
		if strings.TrimSpace(c.Paralelo) != "" {
			parts = append(parts, c.Paralelo)
		}
		if strings.TrimSpace(c.Jornada) != "" {
			parts = append(parts, c.Jornada)
		}
		nombre := strings.Join(parts, " ")
		resp = append(resp, dto.AulaDTO{ID: c.ID, Nombre: nombre})
	}

	return resp, nil
}

// SubirEvidenciaCapacitacion guarda la hoja de firmas escaneada.
func (s *ManagementService) SubirEvidenciaCapacitacion(id uint, rutaOrigen string) (string, error) {
	var cap management.Capacitacion

	// 1. Validar existencia
	if err := s.db.First(&cap, id).Error; err != nil {
		return "", errors.New("capacitación no encontrada")
	}

	// 2. Definir Directorio: "Documents/SistemaDECE/Trainings"
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", errors.New("error al acceder al sistema de archivos")
	}
	destinoDir := filepath.Join(homeDir, "Documents", "SistemaDECE", "Trainings")
	if err := os.MkdirAll(destinoDir, 0755); err != nil {
		return "", fmt.Errorf("error al crear carpeta: %v", err)
	}

	// 3. Generar Nombre Único
	ext := filepath.Ext(rutaOrigen)
	if ext == "" {
		ext = ".jpg"
	} // Asumimos imagen si no tiene extensión, o pdf

	// TALLER_{ID}_{TIMESTAMP}.ext
	nuevoNombre := fmt.Sprintf("TALLER_%d_%d%s", cap.ID, time.Now().Unix(), ext)
	rutaDestinoCompleta := filepath.Join(destinoDir, nuevoNombre)

	// 4. Copiar Archivo
	src, err := os.Open(rutaOrigen)
	if err != nil {
		return "", err
	}
	defer src.Close()

	dst, err := os.Create(rutaDestinoCompleta)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return "", err
	}

	// 5. Borrar evidencia anterior si existía para no llenar el disco
	if cap.RutaEvidencia != "" {
		if _, err := os.Stat(cap.RutaEvidencia); err == nil {
			os.Remove(cap.RutaEvidencia)
		}
	}

	// 6. Actualizar BD
	if err := s.db.Model(&cap).Update("ruta_evidencia", rutaDestinoCompleta).Error; err != nil {
		return "", fmt.Errorf("archivo guardado pero error al actualizar BD: %v", err)
	}

	return rutaDestinoCompleta, nil
}

// EliminarCapacitacion (Opcional, pero útil)
func (s *ManagementService) EliminarCapacitacion(id uint) error {
	var cap management.Capacitacion
	// Obtener datos para borrar el archivo físico también
	if err := s.db.First(&cap, id).Error; err == nil {
		if cap.RutaEvidencia != "" {
			os.Remove(cap.RutaEvidencia)
		}
	}
	return s.db.Delete(&management.Capacitacion{}, id).Error
}

func (s *ManagementService) VerificarAlertas() ([]dto.AlertaDashboardDTO, error) {
	var citas []management.Convocatoria
	var alertas []dto.AlertaDashboardDTO

	// 1. Traer TODAS las citas pendientes (no completadas)
	// Hacemos Preload para saber el nombre del estudiante
	err := s.db.Preload("Matricula.Estudiante").
		Preload("Matricula.Curso.Nivel").
		Where("cita_completada = ?", false).
		Find(&citas).Error

	if err != nil {
		return nil, err
	}

	layout := "2006-01-02 15:04" // Formato de fecha guardado
	ahora := time.Now()

	for _, c := range citas {
		// 2. Parsear fecha de la cita
		fechaCita, err := time.Parse(layout, c.FechaCita)
		if err != nil {
			continue // Si la fecha está corrupta, la saltamos
		}

		// 3. Lógica del "Despertador"
		// Calculamos la fecha de INICIO de la alerta (FechaCita - DiasAlerta)
		fechaInicioAlerta := fechaCita.AddDate(0, 0, -c.DiasAlerta)

		// CONDICIÓN:
		// A. Que estemos DENTRO del rango de alerta (Ahora >= InicioAlerta)
		// B. Que la cita sea en el FUTURO o sea HOY (Ahora < FechaCita + margen de tolerancia)
		//    (Nota: Si la cita ya pasó ayer y no se cerró, ¿quieres que siga saliendo?
		//     Generalmente SÍ, como "Atrasada". Aquí incluyo esa lógica).

		esAlertaActiva := ahora.After(fechaInicioAlerta)

		if esAlertaActiva {
			// Construir datos para el UI
			diasRestantes := int(time.Until(fechaCita).Hours() / 24)
			nombreEst := "Desconocido"
			cursoEst := "S/C"

			if c.Matricula.ID != 0 {
				// Nombre del estudiante
				if c.Matricula.Estudiante.ID != 0 {
					nombreEst = fmt.Sprintf("%s %s", c.Matricula.Estudiante.Apellidos, c.Matricula.Estudiante.Nombres)
				}

				// Construir descripción real del curso (igual a ListarCitas)
				parts := make([]string, 0, 3)
				if c.Matricula.Curso.Nivel.ID != 0 {
					nivel := c.Matricula.Curso.Nivel.NombreCompleto
					if strings.TrimSpace(nivel) == "" {
						nivel = c.Matricula.Curso.Nivel.Nombre
					}
					if strings.TrimSpace(nivel) != "" {
						parts = append(parts, nivel)
					}
				}
				if strings.TrimSpace(c.Matricula.Curso.Paralelo) != "" {
					parts = append(parts, c.Matricula.Curso.Paralelo)
				}
				if strings.TrimSpace(c.Matricula.Curso.Jornada) != "" {
					parts = append(parts, c.Matricula.Curso.Jornada)
				}
				if len(parts) > 0 {
					cursoEst = strings.Join(parts, " ")
				}
			}

			// Definir Urgencia y Color
			nivel := "Media"
			color := "blue"

			if diasRestantes < 0 {
				nivel = "Atrasada"
				color = "red" // Urgente, ya pasó
			} else if diasRestantes <= 1 {
				nivel = "Alta"
				color = "orange" // Es hoy o mañana
			}

			// Agregar al array
			alertas = append(alertas, dto.AlertaDashboardDTO{
				ID:            c.ID,
				Titulo:        fmt.Sprintf("Cita: %s", c.Entidad),
				Descripcion:   fmt.Sprintf("%s (%s)", nombreEst, cursoEst),
				FechaHora:     c.FechaCita,
				DiasRestantes: diasRestantes,
				NivelUrgencia: nivel,
				Color:         color,
			})
		}
	}

	// Opcional: Ordenar por urgencia (las más cercanas o atrasadas primero)
	// (Aquí retornamos en el orden que las encontró, el frontend puede ordenar)

	return alertas, nil
}
