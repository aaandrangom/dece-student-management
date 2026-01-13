package services

import (
	securityDTO "dece/internal/application/dtos/security"
	securityHelper "dece/internal/application/helpers/security"
	"dece/internal/domain/common"
	"dece/internal/domain/security"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type InstitutionService struct {
	db *gorm.DB
}

func NewInstitutionService(db *gorm.DB) *InstitutionService {
	return &InstitutionService{db: db}
}

func (s *InstitutionService) ObtenerConfiguracion() (*securityDTO.ConfiguracionInstitucionalDTO, error) {
	var config security.ConfiguracionInstitucional

	result := s.db.First(&config, 1)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return &securityDTO.ConfiguracionInstitucionalDTO{}, nil
		}
		return nil, result.Error
	}

	response := &securityDTO.ConfiguracionInstitucionalDTO{
		Nombre:             config.Nombre,
		CodigoAMIE:         config.CodigoAMIE,
		Distrito:           config.Distrito,
		Circuito:           config.Circuito,
		FechaActualizacion: config.FechaActualizacion,

		Ubicacion: securityDTO.DetalleUbicacionDTO{
			Provincia:     config.DetalleUbicacion.Data.Provincia,
			Canton:        config.DetalleUbicacion.Data.Canton,
			Parroquia:     config.DetalleUbicacion.Data.Parroquia,
			BarrioRecinto: config.DetalleUbicacion.Data.BarrioRecinto,
		},

		Autoridades: securityDTO.AutoridadesInstitucionDTO{
			Rector:                securityHelper.MapAutoridadToDTO(config.Autoridades.Data.Rector),
			SubdirectorMatutina:   securityHelper.MapAutoridadToDTO(config.Autoridades.Data.SubdirectorMatutina),
			SubdirectorVespertina: securityHelper.MapAutoridadToDTO(config.Autoridades.Data.SubdirectorVespertina),
			InspectorGeneral:      securityHelper.MapAutoridadToDTO(config.Autoridades.Data.InspectorGeneral),
			Subinspector:          securityHelper.MapAutoridadToDTO(config.Autoridades.Data.Subinspector),
			CoordinadorDECE:       securityHelper.MapAutoridadToDTO(config.Autoridades.Data.CoordinadorDECE),
			AnalistaDECE1:         securityHelper.MapAutoridadToDTO(config.Autoridades.Data.AnalistaDECE1),
			AnalistaDECE2:         securityHelper.MapAutoridadToDTO(config.Autoridades.Data.AnalistaDECE2),
		},
	}

	return response, nil
}

func (s *InstitutionService) GuardarConfiguracion(input securityDTO.ConfiguracionInstitucionalDTO) error {
	fmt.Println("Input ", input)

	configModel := security.ConfiguracionInstitucional{
		ID:                 1,
		Nombre:             input.Nombre,
		CodigoAMIE:         input.CodigoAMIE,
		Distrito:           input.Distrito,
		Circuito:           input.Circuito,
		FechaActualizacion: time.Now().Format("2006-01-02 15:04:05"),
	}

	configModel.DetalleUbicacion = common.JSONMap[security.DetalleUbicacion]{
		Data: security.DetalleUbicacion{
			Provincia:     input.Ubicacion.Provincia,
			Canton:        input.Ubicacion.Canton,
			Parroquia:     input.Ubicacion.Parroquia,
			BarrioRecinto: input.Ubicacion.BarrioRecinto,
		},
	}

	configModel.Autoridades = common.JSONMap[security.AutoridadesInstitucion]{
		Data: security.AutoridadesInstitucion{
			Rector:                securityHelper.MapDTOToAutoridad(input.Autoridades.Rector),
			SubdirectorMatutina:   securityHelper.MapDTOToAutoridad(input.Autoridades.SubdirectorMatutina),
			SubdirectorVespertina: securityHelper.MapDTOToAutoridad(input.Autoridades.SubdirectorVespertina),
			InspectorGeneral:      securityHelper.MapDTOToAutoridad(input.Autoridades.InspectorGeneral),
			Subinspector:          securityHelper.MapDTOToAutoridad(input.Autoridades.Subinspector),
			CoordinadorDECE:       securityHelper.MapDTOToAutoridad(input.Autoridades.CoordinadorDECE),
			AnalistaDECE1:         securityHelper.MapDTOToAutoridad(input.Autoridades.AnalistaDECE1),
			AnalistaDECE2:         securityHelper.MapDTOToAutoridad(input.Autoridades.AnalistaDECE2),
		},
	}

	if err := s.db.Save(&configModel).Error; err != nil {
		return err
	}

	return nil
}
