package services

import (
	"dece/internal/domain/security"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type SecurityConfigService struct {
	db *gorm.DB
}

func NewSecurityConfigService(db *gorm.DB) *SecurityConfigService {
	svc := &SecurityConfigService{db: db}
	svc.seedDefaults()
	return svc
}

// seedDefaults crea las configuraciones por defecto si no existen.
func (s *SecurityConfigService) seedDefaults() {
	defaults := []security.ConfiguracionSeguridad{
		{
			Clave:       "seguimiento_requiere_clave",
			Valor:       false,
			Descripcion: "Solicitar contraseña al acceder al módulo de Seguimiento DECE",
		},
	}

	for _, cfg := range defaults {
		var existing security.ConfiguracionSeguridad
		if err := s.db.Where("clave = ?", cfg.Clave).First(&existing).Error; err != nil {
			s.db.Create(&cfg)
		}
	}
}

// ObtenerConfiguracion retorna el valor de una configuración por su clave.
func (s *SecurityConfigService) ObtenerConfiguracion(clave string) (bool, error) {
	var cfg security.ConfiguracionSeguridad
	if err := s.db.Where("clave = ?", clave).First(&cfg).Error; err != nil {
		return false, nil
	}
	return cfg.Valor, nil
}

// ActualizarConfiguracion cambia el valor de una configuración.
func (s *SecurityConfigService) ActualizarConfiguracion(clave string, valor bool) error {
	result := s.db.Model(&security.ConfiguracionSeguridad{}).
		Where("clave = ?", clave).
		Update("valor", valor)
	return result.Error
}

// ListarConfiguraciones devuelve todas las configuraciones de seguridad.
func (s *SecurityConfigService) ListarConfiguraciones() ([]security.ConfiguracionSeguridad, error) {
	var configs []security.ConfiguracionSeguridad
	result := s.db.Order("id asc").Find(&configs)
	return configs, result.Error
}

// VerificarClaveUsuario verifica la contraseña del usuario actual para acceso a módulos protegidos.
func (s *SecurityConfigService) VerificarClaveUsuario(userID uint, clave string) (bool, error) {
	var user security.Usuario
	if err := s.db.First(&user, userID).Error; err != nil {
		return false, nil
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.ClaveHash), []byte(clave))
	return err == nil, nil
}
