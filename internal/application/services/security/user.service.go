package services

import (
	"context"
	usuarioDTO "dece/internal/application/dtos/security"
	"dece/internal/domain/security"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService struct {
	db  *gorm.DB
	ctx context.Context
}

func NewUserService(db *gorm.DB) *UserService {
	return &UserService{db: db}
}

func (s *UserService) SetContext(ctx context.Context) {
	s.ctx = ctx
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
			Cargo:          user.Cargo,
			FotoPerfil:     user.FotoPerfil,
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

func (s *UserService) ActualizarUsuario(id uint, nombreUsuario string, nombreCompleto string, cargo string) error {
	// Validar que el nombre de usuario no esté duplicado (excluyendo al usuario actual)
	var existing security.Usuario
	if err := s.db.Where("nombre_usuario = ? AND id != ?", nombreUsuario, id).First(&existing).Error; err == nil {
		return errors.New("El nombre de usuario ya está en uso por otro usuario")
	}

	result := s.db.Model(&security.Usuario{}).Where("id = ?", id).Updates(map[string]interface{}{
		"nombre_usuario":  nombreUsuario,
		"nombre_completo": nombreCompleto,
		"cargo":           cargo,
	})

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("Usuario no encontrado")
	}

	return nil
}

// SubirFotoPerfil abre un diálogo nativo para seleccionar una imagen y la guarda como foto de perfil.
func (s *UserService) SubirFotoPerfil(userID uint) (string, error) {
	if s.ctx == nil {
		return "", errors.New("Contexto no inicializado")
	}

	// Verificar que el usuario existe
	var user security.Usuario
	if err := s.db.First(&user, userID).Error; err != nil {
		return "", errors.New("Usuario no encontrado")
	}

	// Abrir diálogo de selección de imagen
	filePath, err := runtime.OpenFileDialog(s.ctx, runtime.OpenDialogOptions{
		Title: "Seleccionar foto de perfil",
		Filters: []runtime.FileFilter{
			{DisplayName: "Imágenes", Pattern: "*.jpg;*.jpeg;*.png;*.webp"},
		},
	})
	if err != nil {
		return "", fmt.Errorf("Error al abrir selector: %v", err)
	}
	if filePath == "" {
		return "", errors.New("No se seleccionó ningún archivo")
	}

	// Crear directorio de fotos de perfil
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", errors.New("Error al acceder al sistema de archivos")
	}
	destinoDir := filepath.Join(homeDir, "Documents", "SistemaDECE", "Profiles")
	if err := os.MkdirAll(destinoDir, 0755); err != nil {
		return "", fmt.Errorf("Error al crear carpeta: %v", err)
	}

	// Generar nombre único
	ext := strings.ToLower(filepath.Ext(filePath))
	if ext == "" {
		ext = ".jpg"
	}
	nuevoNombre := fmt.Sprintf("profile_%d_%d%s", userID, time.Now().Unix(), ext)
	rutaDestino := filepath.Join(destinoDir, nuevoNombre)

	// Copiar archivo
	src, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("Error al abrir imagen: %v", err)
	}
	defer src.Close()

	dst, err := os.Create(rutaDestino)
	if err != nil {
		return "", fmt.Errorf("Error al guardar imagen: %v", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return "", fmt.Errorf("Error al copiar imagen: %v", err)
	}

	// Eliminar foto anterior si existe
	if user.FotoPerfil != "" {
		if _, err := os.Stat(user.FotoPerfil); err == nil {
			os.Remove(user.FotoPerfil)
		}
	}

	// Actualizar en BD
	if err := s.db.Model(&user).Update("foto_perfil", rutaDestino).Error; err != nil {
		return "", fmt.Errorf("Imagen guardada pero error al actualizar BD: %v", err)
	}

	return rutaDestino, nil
}

// ObtenerFotoPerfilBase64 lee la imagen del disco y la retorna como base64 para usar en <img src>.
func (s *UserService) ObtenerFotoPerfilBase64(userID uint) (string, error) {
	var user security.Usuario
	if err := s.db.First(&user, userID).Error; err != nil {
		return "", errors.New("Usuario no encontrado")
	}

	if user.FotoPerfil == "" {
		return "", nil
	}

	data, err := os.ReadFile(user.FotoPerfil)
	if err != nil {
		return "", nil // Si no existe el archivo, retornar vacío silenciosamente
	}

	ext := strings.ToLower(filepath.Ext(user.FotoPerfil))
	mimeType := "image/jpeg"
	switch ext {
	case ".png":
		mimeType = "image/png"
	case ".webp":
		mimeType = "image/webp"
	}

	encoded := base64.StdEncoding.EncodeToString(data)
	return fmt.Sprintf("data:%s;base64,%s", mimeType, encoded), nil
}
