package helpers

import (
	dtos "dece/internal/application/dtos/security"
	"dece/internal/domain/security"
)

func MapAutoridadToDTO(a security.Autoridad) dtos.AutoridadDTO {
	return dtos.AutoridadDTO{
		Cedula:    a.Cedula,
		Nombres:   a.Nombres,
		Apellidos: a.Apellidos,
		Telefono:  a.Telefono,
		Jornada:   a.Jornada,
	}
}

func MapDTOToAutoridad(d dtos.AutoridadDTO) security.Autoridad {
	return security.Autoridad{
		Cedula:    d.Cedula,
		Nombres:   d.Nombres,
		Apellidos: d.Apellidos,
		Telefono:  d.Telefono,
		Jornada:   d.Jornada,
	}
}
