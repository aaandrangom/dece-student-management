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

	fechaStr := ""
	if !config.FechaActualizacion.IsZero() {
		fechaStr = config.FechaActualizacion.Format(time.RFC3339)
	}

	response := &securityDTO.ConfiguracionInstitucionalDTO{
		Nombre:             config.Nombre,
		CodigoAMIE:         config.CodigoAMIE,
		Distrito:           config.Distrito,
		Circuito:           config.Circuito,
		FechaActualizacion: fechaStr,

		Ubicacion: securityDTO.DetalleUbicacionDTO{
			Provincia:     config.DetalleUbicacion.Data.Provincia,
			Canton:        config.DetalleUbicacion.Data.Canton,
			Parroquia:     config.DetalleUbicacion.Data.Parroquia,
			BarrioRecinto: config.DetalleUbicacion.Data.BarrioRecinto,
		},

		Autoridades: securityDTO.AutoridadesInstitucionDTO{
			Rector:           securityHelper.MapAutoridadToDTO(config.Autoridades.Data.Rector),
			Subdirector:      securityHelper.MapAutoridadToDTO(config.Autoridades.Data.Subdirector),
			InspectorGeneral: securityHelper.MapAutoridadToDTO(config.Autoridades.Data.InspectorGeneral),
			ResponsableDECE:  securityHelper.MapAutoridadToDTO(config.Autoridades.Data.ResponsableDECE),
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
		FechaActualizacion: time.Now(),
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
			Rector:           securityHelper.MapDTOToAutoridad(input.Autoridades.Rector),
			Subdirector:      securityHelper.MapDTOToAutoridad(input.Autoridades.Subdirector),
			InspectorGeneral: securityHelper.MapDTOToAutoridad(input.Autoridades.InspectorGeneral),
			ResponsableDECE:  securityHelper.MapDTOToAutoridad(input.Autoridades.ResponsableDECE),
		},
	}

	if err := s.db.Save(&configModel).Error; err != nil {
		return err
	}

	return nil
}
