package services

import (
	"dece/internal/domain/institution"
	"errors"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type LoginResponse struct {
	NombresCompletos string `json:"nombres_completos"`
	Rol              string `json:"rol"`
}

type AuthService struct {
	db *gorm.DB
}

func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{db: db}
}

func (s *AuthService) Login(username, password string) (LoginResponse, error) {
	var user institution.Usuario
	result := s.db.Preload("Rol").Where("username = ?", username).First(&user)
	if result.Error != nil {
		return LoginResponse{}, errors.New("usuario no encontrado")
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return LoginResponse{}, errors.New("contraseña incorrecta")
	}

	if !user.Activo {
		return LoginResponse{}, errors.New("usuario inactivo")
	}

	return LoginResponse{
		NombresCompletos: user.NombresCompletos,
		Rol:              user.Rol.Nombre,
	}, nil
}
