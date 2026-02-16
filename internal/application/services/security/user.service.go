package services

import (
	usuarioDTO "dece/internal/application/dtos/security"
	"dece/internal/domain/security"
	"errors"
	"fmt"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService struct {
	db *gorm.DB
}

func NewUserService(db *gorm.DB) *UserService {
	return &UserService{db: db}
}

func (s *UserService) ListarUsuarios() ([]usuarioDTO.UsuarioResponseDTO, error) {
	var usuarios []security.Usuario

	result := s.db.Order("nombre_completo asc").Find(&usuarios)
	if result.Error != nil {
		return nil, result.Error
	}

	response := make([]usuarioDTO.UsuarioResponseDTO, len(usuarios))

	for i, user := range usuarios {
		response[i] = usuarioDTO.UsuarioResponseDTO{
			ID:             user.ID,
			NombreUsuario:  user.NombreUsuario,
			NombreCompleto: user.NombreCompleto,
			Rol:            user.Rol,
			Activo:         user.Activo,
			FechaCreacion:  user.FechaCreacion,
		}
	}

	return response, nil
}

func (s *UserService) CambiarMiClave(id uint, claveActual string, claveNueva string) error {
	var user security.Usuario

	if err := s.db.First(&user, id).Error; err != nil {
		return errors.New("Usuario no encontrado")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.ClaveHash), []byte(claveActual)); err != nil {
		return errors.New("La contraseña actual es incorrecta")
	}

	nuevoHash, err := bcrypt.GenerateFromPassword([]byte(claveNueva), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("Error de encriptación: %v", err)
	}

	return s.db.Model(&user).Update("clave_hash", string(nuevoHash)).Error
}

func (s *UserService) ActualizarUsuario(id uint, nombreUsuario string, nombreCompleto string) error {
	// Validar que el nombre de usuario no esté duplicado (excluyendo al usuario actual)
	var existing security.Usuario
	if err := s.db.Where("nombre_usuario = ? AND id != ?", nombreUsuario, id).First(&existing).Error; err == nil {
		return errors.New("El nombre de usuario ya está en uso por otro usuario")
	}

	result := s.db.Model(&security.Usuario{}).Where("id = ?", id).Updates(map[string]interface{}{
		"nombre_usuario":  nombreUsuario,
		"nombre_completo": nombreCompleto,
	})

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("Usuario no encontrado")
	}

	return nil
}
