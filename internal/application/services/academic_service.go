package services

import (
	"dece/internal/domain/academic"
	"dece/internal/domain/student"
	"errors"
	"time"

	"gorm.io/gorm"
)

type AcademicService struct {
	db *gorm.DB
}

func NewAcademicService(db *gorm.DB) *AcademicService {
	return &AcademicService{db: db}
}

func (s *AcademicService) GetAniosLectivos() ([]academic.AnioLectivo, error) {
	var anios []academic.AnioLectivo
	result := s.db.Order("id desc").Find(&anios)
	return anios, result.Error
}

func (s *AcademicService) CreateAnioLectivo(nombre string, fechaInicio time.Time, fechaFin time.Time) (academic.AnioLectivo, error) {
	anio := academic.AnioLectivo{
		Nombre:      nombre,
		FechaInicio: fechaInicio,
		FechaFin:    fechaFin,
		Activo:      false,
		Cerrado:     false,
	}

	result := s.db.Create(&anio)
	return anio, result.Error
}

func (s *AcademicService) UpdateAnioFechas(id uint, fechaInicio time.Time, fechaFin time.Time) error {
	return s.db.Model(&academic.AnioLectivo{}).Where("id = ?", id).Updates(map[string]interface{}{
		"fecha_inicio": fechaInicio,
		"fecha_fin":    fechaFin,
	}).Error
}

func (s *AcademicService) ActivateAnioLectivo(id uint) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&academic.AnioLectivo{}).Where("activo = ?", true).Update("activo", false).Error; err != nil {
			return err
		}

		if err := tx.Model(&academic.AnioLectivo{}).Where("id = ?", id).Update("activo", true).Error; err != nil {
			return err
		}

		return nil
	})
}

func (s *AcademicService) CloseAnioLectivo(id uint) error {
	return s.db.Model(&academic.AnioLectivo{}).Where("id = ?", id).Update("cerrado", true).Error
}

func (s *AcademicService) DeleteAnioLectivo(id uint) error {
	var count int64
	err := s.db.Model(&student.HistorialAcademico{}).
		Joins("JOIN aulas ON aulas.id = historial_academicos.aula_id").
		Where("aulas.anio_lectivo_id = ?", id).
		Count(&count).Error

	if err != nil {
		return err
	}

	if count > 0 {
		return errors.New("no se puede eliminar el año lectivo porque tiene estudiantes matriculados")
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("aula_id IN (SELECT id FROM aulas WHERE anio_lectivo_id = ?)", id).Delete(&academic.CargaHoraria{}).Error; err != nil {
			return err
		}

		if err := tx.Where("anio_lectivo_id = ?", id).Delete(&academic.Aula{}).Error; err != nil {
			return err
		}

		if err := tx.Delete(&academic.AnioLectivo{}, id).Error; err != nil {
			return err
		}
		return nil
	})
}

func (s *AcademicService) CloneAnioStructure(sourceYearID uint, targetYearID uint) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		var sourceAulas []academic.Aula
		if err := tx.Where("anio_lectivo_id = ?", sourceYearID).Find(&sourceAulas).Error; err != nil {
			return err
		}

		if len(sourceAulas) == 0 {
			return errors.New("el año origen no tiene estructura para clonar")
		}

		for _, sourceAula := range sourceAulas {
			newAula := academic.Aula{
				AnioLectivoID:  targetYearID,
				CursoID:        sourceAula.CursoID,
				ParaleloID:     sourceAula.ParaleloID,
				TutorDocenteID: sourceAula.TutorDocenteID,
			}

			if err := tx.Create(&newAula).Error; err != nil {
				return err
			}

			var sourceCargas []academic.CargaHoraria
			if err := tx.Where("aula_id = ?", sourceAula.ID).Find(&sourceCargas).Error; err != nil {
				return err
			}

			for _, sourceCarga := range sourceCargas {
				newCarga := academic.CargaHoraria{
					AulaID:    newAula.ID,
					MateriaID: sourceCarga.MateriaID,
					DocenteID: sourceCarga.DocenteID,
				}
				if err := tx.Create(&newCarga).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}
