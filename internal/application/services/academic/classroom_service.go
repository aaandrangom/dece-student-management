package academic

import (
	"dece/internal/domain/academic"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type ClassroomService struct {
	db *gorm.DB
}

func NewClassroomService(db *gorm.DB) *ClassroomService {
	return &ClassroomService{db: db}
}

// DTOs
type AulaDTO struct {
	ID             uint   `json:"id"`
	AnioLectivoID  uint   `json:"anio_lectivo_id"`
	CursoID        uint   `json:"curso_id"`
	CursoNombre    string `json:"curso_nombre"`
	ParaleloID     uint   `json:"paralelo_id"`
	ParaleloNombre string `json:"paralelo_nombre"`
	TutorID        *uint  `json:"tutor_id"`
	TutorNombre    string `json:"tutor_nombre"`
}

type CargaHorariaDTO struct {
	ID            uint   `json:"id"`
	AulaID        uint   `json:"aula_id"`
	MateriaID     uint   `json:"materia_id"`
	MateriaNombre string `json:"materia_nombre"`
	DocenteID     uint   `json:"docente_id"`
	DocenteNombre string `json:"docente_nombre"`
}

// --- Gestión de Aulas ---

// GetAulasByAnio obtiene todas las aulas de un año lectivo específico
func (s *ClassroomService) GetAulasByAnio(anioID uint) ([]AulaDTO, error) {
	var aulas []academic.Aula
	var result []AulaDTO

	err := s.db.Preload("Curso").Preload("Paralelo").Preload("TutorDocente").
		Where("anio_lectivo_id = ?", anioID).
		Find(&aulas).Error

	if err != nil {
		return nil, err
	}

	for _, a := range aulas {
		dto := AulaDTO{
			ID:             a.ID,
			AnioLectivoID:  a.AnioLectivoID,
			CursoID:        a.CursoID,
			CursoNombre:    a.Curso.Nombre,
			ParaleloID:     a.ParaleloID,
			ParaleloNombre: a.Paralelo.Nombre,
			TutorID:        a.TutorDocenteID,
		}
		if a.TutorDocente != nil {
			dto.TutorNombre = fmt.Sprintf("%s %s", a.TutorDocente.Apellidos, a.TutorDocente.Nombres)
		} else {
			dto.TutorNombre = "Sin Asignar"
		}
		result = append(result, dto)
	}

	return result, nil
}

// CreateAula crea una nueva aula validando duplicados
func (s *ClassroomService) CreateAula(anioID, cursoID, paraleloID uint, tutorID *uint) error {
	// 1. Validar existencia
	var count int64
	s.db.Model(&academic.Aula{}).
		Where("anio_lectivo_id = ? AND curso_id = ? AND paralelo_id = ?", anioID, cursoID, paraleloID).
		Count(&count)

	if count > 0 {
		return errors.New("ya existe un aula con este curso y paralelo en el año lectivo seleccionado")
	}

	// 2. Crear
	aula := academic.Aula{
		AnioLectivoID:  anioID,
		CursoID:        cursoID,
		ParaleloID:     paraleloID,
		TutorDocenteID: tutorID,
	}

	return s.db.Create(&aula).Error
}

// DeleteAula elimina un aula si no tiene dependencias (estudiantes matriculados)
// Nota: Por ahora validamos Carga Horaria, en el futuro Estudiantes
func (s *ClassroomService) DeleteAula(id uint) error {
	// Verificar Carga Horaria
	var countCarga int64
	s.db.Model(&academic.CargaHoraria{}).Where("aula_id = ?", id).Count(&countCarga)
	if countCarga > 0 {
		return errors.New("no se puede eliminar el aula porque tiene materias asignadas (Malla Curricular)")
	}

	// TODO: Verificar Estudiantes matriculados cuando exista el módulo

	return s.db.Delete(&academic.Aula{}, id).Error
}

// --- Gestión de Malla Curricular (Carga Horaria) ---

// GetCargaHoraria obtiene las materias y docentes asignados a un aula
func (s *ClassroomService) GetCargaHoraria(aulaID uint) ([]CargaHorariaDTO, error) {
	var cargas []academic.CargaHoraria
	var result []CargaHorariaDTO

	// Usamos Preload para traer los datos relacionados
	// Nota: Asegurarse que los nombres de las relaciones en el modelo CargaHoraria sean correctos (Materia, Docente)
	err := s.db.Preload("Materia").Preload("Docente").
		Where("aula_id = ?", aulaID).
		Find(&cargas).Error

	if err != nil {
		return nil, err
	}

	for _, c := range cargas {
		result = append(result, CargaHorariaDTO{
			ID:            c.ID,
			AulaID:        c.AulaID,
			MateriaID:     c.MateriaID,
			MateriaNombre: c.Materia.Nombre,
			DocenteID:     c.DocenteID,
			DocenteNombre: fmt.Sprintf("%s %s", c.Docente.Apellidos, c.Docente.Nombres),
		})
	}

	return result, nil
}

// AssignMateria asigna o actualiza una materia con un docente en el aula
func (s *ClassroomService) AssignMateria(aulaID, materiaID, docenteID uint) error {
	// Verificar si ya existe la materia en el aula para actualizar el docente, o crear nueva
	var carga academic.CargaHoraria
	err := s.db.Where("aula_id = ? AND materia_id = ?", aulaID, materiaID).First(&carga).Error

	if err == nil {
		// Existe: Actualizar Docente
		carga.DocenteID = docenteID
		return s.db.Save(&carga).Error
	} else if errors.Is(err, gorm.ErrRecordNotFound) {
		// No existe: Crear
		nuevaCarga := academic.CargaHoraria{
			AulaID:    aulaID,
			MateriaID: materiaID,
			DocenteID: docenteID,
		}
		return s.db.Create(&nuevaCarga).Error
	} else {
		return err
	}
}

// RemoveMateria quita una materia del aula
func (s *ClassroomService) RemoveMateria(cargaID uint) error {
	return s.db.Delete(&academic.CargaHoraria{}, cargaID).Error
}
