package services

import (
	usuarioDTO "dece/internal/application/dtos/security"
	"dece/internal/domain/security"
	"errors"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	db          *gorm.DB
	currentUser *security.Usuario
}

func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{db: db}
}

func (s *AuthService) Login(usuario string, clave string) (*usuarioDTO.UsuarioResponseDTO, error) {
	var user security.Usuario

	result := s.db.Where("nombre_usuario = ?", usuario).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("Credenciales inválidas")
		}
		return nil, result.Error
	}

	if !user.Activo {
		return nil, errors.New("El usuario no está activo, contacte al administrador")
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.ClaveHash), []byte(clave))
	if err != nil {
		return nil, errors.New("Credenciales inválidas")
	}

	s.currentUser = &user

	return s.mapToDTO(&user), nil
}

func (s *AuthService) Logout() {
	s.currentUser = nil
}

func (s *AuthService) ObtenerUsuarioSesion() (*usuarioDTO.UsuarioResponseDTO, error) {
	if s.currentUser == nil {
		return nil, errors.New("no hay usuario autenticado en la sesión")
	}

	// Re-leer desde BD para obtener datos frescos (ej: foto actualizada)
	var user security.Usuario
	if err := s.db.First(&user, s.currentUser.ID).Error; err != nil {
		return nil, errors.New("usuario no encontrado")
	}
	s.currentUser = &user

	return s.mapToDTO(s.currentUser), nil
}

func (s *AuthService) mapToDTO(u *security.Usuario) *usuarioDTO.UsuarioResponseDTO {
	return &usuarioDTO.UsuarioResponseDTO{
		ID:             u.ID,
		NombreUsuario:  u.NombreUsuario,
		NombreCompleto: u.NombreCompleto,
		Rol:            u.Rol,
		Activo:         u.Activo,
		FechaCreacion:  u.FechaCreacion,
		Cargo:          u.Cargo,
		FotoPerfil:     u.FotoPerfil,
	}
}
