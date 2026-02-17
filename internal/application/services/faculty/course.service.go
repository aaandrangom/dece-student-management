package services

import (
	courseDTO "dece/internal/application/dtos/faculty"
	"dece/internal/domain/academic"
	"dece/internal/domain/faculty"
	"errors"
	"fmt"
	"strings"

	"gorm.io/gorm"
)

type CourseService struct {
	db *gorm.DB
}

func NewCourseService(db *gorm.DB) *CourseService {
	return &CourseService{db: db}
}

func (s *CourseService) ListarCursos(periodoID uint) ([]courseDTO.CursoResponseDTO, error) {
	var cursos []faculty.Curso

	result := s.db.
		Preload("Nivel").
		Preload("Tutor").
		Joins("JOIN nivel_educativos ON nivel_educativos.id = cursos.nivel_id").
		Where("cursos.periodo_id = ?", periodoID).
		Order("nivel_educativos.orden ASC").
		Order("cursos.paralelo ASC").
		Find(&cursos)

	if result.Error != nil {
		return nil, result.Error
	}

	response := make([]courseDTO.CursoResponseDTO, len(cursos))
	for i, c := range cursos {
		tutorNombre := "Sin Tutor Asignado"

		if c.TutorID != nil {
			tutorNombre = c.Tutor.NombresCompletos
		}

		nombreFull := fmt.Sprintf("%s %s - %s", c.Nivel.Nombre, c.Paralelo, c.Jornada)

		response[i] = courseDTO.CursoResponseDTO{
			ID:             c.ID,
			NivelNombre:    c.Nivel.Nombre,
			Paralelo:       c.Paralelo,
			Jornada:        c.Jornada,
			TutorNombre:    tutorNombre,
			NombreCompleto: nombreFull,
			NivelID:        c.NivelID,
			TutorID:        c.TutorID,
		}
	}

	return response, nil
}

func (s *CourseService) CrearCurso(input courseDTO.GuardarCursoDTO) error {
	paralelo := strings.ToUpper(strings.TrimSpace(input.Paralelo))

	var count int64
	s.db.Model(&faculty.Curso{}).
		Where("periodo_id = ? AND nivel_id = ? AND paralelo = ? AND jornada = ?",
			input.PeriodoID, input.NivelID, paralelo, input.Jornada).
		Count(&count)

	if count > 0 {
		return fmt.Errorf("Ya existe el curso %s de la jornada %s en este periodo", paralelo, input.Jornada)
	}

	if input.TutorID != nil {
		var countTutor int64
		s.db.Model(&faculty.Curso{}).
			Where("periodo_id = ? AND tutor_id = ?", input.PeriodoID, input.TutorID).
			Count(&countTutor)

		if countTutor > 0 {
			return errors.New("El docente seleccionado ya es tutor de otro curso en este periodo lectivo")
		}
	}

	nuevoCurso := faculty.Curso{
		PeriodoID: input.PeriodoID,
		NivelID:   input.NivelID,
		Paralelo:  paralelo,
		Jornada:   input.Jornada,
		TutorID:   input.TutorID,
	}

	if err := s.db.Create(&nuevoCurso).Error; err != nil {
		return fmt.Errorf("Error al crear el curso: %v", err)
	}

	return nil
}

func (s *CourseService) ActualizarCurso(input courseDTO.GuardarCursoDTO) error {
	var curso faculty.Curso

	if err := s.db.First(&curso, input.ID).Error; err != nil {
		return errors.New("El curso no existe")
	}

	paralelo := strings.ToUpper(strings.TrimSpace(input.Paralelo))

	var count int64
	s.db.Model(&faculty.Curso{}).
		Where("periodo_id = ? AND nivel_id = ? AND paralelo = ? AND jornada = ? AND id <> ?",
			curso.PeriodoID, input.NivelID, paralelo, input.Jornada, input.ID).
		Count(&count)

	if count > 0 {
		return fmt.Errorf("Ya existe otro curso definido como %s - %s", paralelo, input.Jornada)
	}

	if input.TutorID != nil {
		var countTutor int64
		s.db.Model(&faculty.Curso{}).
			Where("periodo_id = ? AND tutor_id = ? AND id <> ?",
				curso.PeriodoID, input.TutorID, input.ID).
			Count(&countTutor)

		if countTutor > 0 {
			return errors.New("El docente seleccionado ya es tutor de otro curso en este periodo lectivo")
		}
	}

	curso.NivelID = input.NivelID
	curso.Paralelo = paralelo
	curso.Jornada = input.Jornada
	curso.TutorID = input.TutorID

	return s.db.Save(&curso).Error
}

func (s *CourseService) EliminarCurso(id uint) error {
	var curso faculty.Curso

	if err := s.db.First(&curso, id).Error; err != nil {
		return errors.New("El curso que intenta eliminar no existe")
	}

	var totalAlumnos int64
	s.db.Table("matriculas").Where("curso_id = ?", id).Count(&totalAlumnos)

	if totalAlumnos > 0 {
		return fmt.Errorf("No se puede eliminar: existen %d estudiantes matriculados en este curso. Debe retirarlos o reubicarlos primero", totalAlumnos)
	}

	var totalDistributivo int64
	s.db.Table("distributivo_materias").Where("curso_id = ?", id).Count(&totalDistributivo)

	if totalDistributivo > 0 {
		return fmt.Errorf("No se puede eliminar: el curso tiene %d materias/docentes asignados en el distributivo. Limpie el distributivo primero", totalDistributivo)
	}

	if err := s.db.Delete(&curso).Error; err != nil {
		return fmt.Errorf("Error de base de datos al eliminar el curso: %v", err)
	}

	return nil
}

func (s *CourseService) GenerarCursosMasivos() (string, error) {
	// 1. Obtener periodo activo
	var periodo academic.PeriodoLectivo
	if err := s.db.Where("es_activo = ?", true).First(&periodo).Error; err != nil {
		return "", errors.New("No se encontró ningún periodo lectivo activo. Por favor active uno primero.")
	}

	// 2. Definir niveles requeridos (según la tabla proporcionada por el usuario)
	nivelesRequeridos := []struct {
		Nombre         string
		NombreCompleto string
		Orden          int
	}{
		{Nombre: "1ro EGB", NombreCompleto: "Primer Año de Educación General Básica", Orden: 1},
		{Nombre: "2do EGB", NombreCompleto: "Segundo Año de Educación General Básica", Orden: 2},
		{Nombre: "3ro EGB", NombreCompleto: "Tercer Año de Educación General Básica", Orden: 3},
		{Nombre: "4to EGB", NombreCompleto: "Cuarto Año de Educación General Básica", Orden: 4},
		{Nombre: "5to EGB", NombreCompleto: "Quinto Año de Educación General Básica", Orden: 5},
		{Nombre: "6to EGB", NombreCompleto: "Sexto Año de Educación General Básica", Orden: 6},
		{Nombre: "7mo EGB", NombreCompleto: "Séptimo Año de Educación General Básica", Orden: 7},
		{Nombre: "8vo EGB", NombreCompleto: "Octavo Año de Educación General Básica", Orden: 8},
		{Nombre: "9no EGB", NombreCompleto: "Noveno Año de Educación General Básica", Orden: 9},
		{Nombre: "10mo EGB", NombreCompleto: "Décimo Año de Educación General Básica", Orden: 10},
	}

	creados := 0
	omitidos := 0

	// 3. Iterar y Asegurar Niveles + Crear Cursos
	for _, req := range nivelesRequeridos {
		var nivel academic.NivelEducativo

		// Buscar nivel por nombre, si no existe, crearlo
		if err := s.db.Where("nombre = ?", req.Nombre).First(&nivel).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				// Crear nivel si no existe
				nivel = academic.NivelEducativo{
					Nombre:         req.Nombre,
					NombreCompleto: req.NombreCompleto,
					Orden:          req.Orden,
				}
				if errCreate := s.db.Create(&nivel).Error; errCreate != nil {
					return "", fmt.Errorf("Error al crear nivel %s: %v", req.Nombre, errCreate) // Return early on error
				}
			} else {
				return "", fmt.Errorf("Error al buscar nivel %s: %v", req.Nombre, err)
			}
		}

		// Definir paralelos A-E
		paralelos := []string{"A", "B", "C", "D", "E"}

		for _, p := range paralelos {
			// Verificar si ya existe este curso para este periodo y nivel
			var count int64
			s.db.Model(&faculty.Curso{}).
				Where("periodo_id = ? AND nivel_id = ? AND paralelo = ? AND jornada = ?",
					periodo.ID, nivel.ID, p, "Matutina").
				Count(&count)

			if count == 0 {
				nuevoCurso := faculty.Curso{
					PeriodoID: periodo.ID,
					NivelID:   nivel.ID,
					Paralelo:  p,
					Jornada:   "Matutina", // Default a Matutina comom se solicito en otra ocasion o estandar
				}
				if errCreate := s.db.Create(&nuevoCurso).Error; errCreate != nil {
					return "", fmt.Errorf("Error creando curso %s %s: %v", req.Nombre, p, errCreate)
				}
				creados++
			} else {
				omitidos++
			}
		}
	}

	return fmt.Sprintf("Proceso completado para el periodo %s.\nCursos creados: %d\nCursos ya existentes (omitidos): %d", periodo.Nombre, creados, omitidos), nil
}
