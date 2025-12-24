package academic

import (
	"dece/internal/domain/academic"
	"errors"
	"strconv"
	"strings"

	"gorm.io/gorm"
)

type TeacherService struct {
	db *gorm.DB
}

func NewTeacherService(db *gorm.DB) *TeacherService {
	return &TeacherService{db: db}
}

func (s *TeacherService) GetDocentes(query string) ([]academic.Docente, error) {
	var docentes []academic.Docente
	db := s.db.Order("apellidos asc, nombres asc")

	if query != "" {
		query = "%" + strings.ToLower(query) + "%"
		db = db.Where("LOWER(cedula) LIKE ? OR LOWER(apellidos) LIKE ? OR LOWER(nombres) LIKE ?", query, query, query)
	}

	result := db.Find(&docentes)
	return docentes, result.Error
}

func (s *TeacherService) CreateDocente(cedula, apellidos, nombres, email, telefono string) (academic.Docente, error) {
	// Validar Cédula
	if !validarCedulaEcuador(cedula) {
		return academic.Docente{}, errors.New("cédula inválida")
	}

	// Validar duplicados
	var count int64
	s.db.Model(&academic.Docente{}).Where("cedula = ?", cedula).Count(&count)
	if count > 0 {
		return academic.Docente{}, errors.New("ya existe un docente con esa cédula")
	}

	docente := academic.Docente{
		Cedula:    cedula,
		Apellidos: strings.ToUpper(apellidos),
		Nombres:   strings.ToUpper(nombres),
		Email:     email,
		Telefono:  telefono,
		Activo:    true,
	}

	result := s.db.Create(&docente)
	return docente, result.Error
}

func (s *TeacherService) UpdateDocente(id uint, apellidos, nombres, email, telefono string) error {
	return s.db.Model(&academic.Docente{}).Where("id = ?", id).Updates(map[string]interface{}{
		"apellidos": strings.ToUpper(apellidos),
		"nombres":   strings.ToUpper(nombres),
		"email":     email,
		"telefono":  telefono,
	}).Error
}

func (s *TeacherService) ToggleDocenteState(id uint) error {
	var docente academic.Docente
	if err := s.db.First(&docente, id).Error; err != nil {
		return err
	}

	return s.db.Model(&docente).Update("activo", !docente.Activo).Error
}

// GetDocenteHistory retorna el historial de materias impartidas por el docente
func (s *TeacherService) GetDocenteHistory(docenteID uint) ([]map[string]interface{}, error) {
	var history []map[string]interface{}

	rows, err := s.db.Table("carga_horaria").
		Select("anio_lectivos.nombre as anio, materia.nombre as materia, cursos.nombre as curso, paralelos.nombre as paralelo").
		Joins("JOIN aulas ON aulas.id = carga_horaria.aula_id").
		Joins("JOIN anio_lectivos ON anio_lectivos.id = aulas.anio_lectivo_id").
		Joins("JOIN materia ON materia.id = carga_horaria.materia_id").
		Joins("JOIN cursos ON cursos.id = aulas.curso_id").
		Joins("JOIN paralelos ON paralelos.id = aulas.paralelo_id").
		Where("carga_horaria.docente_id = ?", docenteID).
		Order("anio_lectivos.id desc").
		Rows()

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var anio, materia, curso, paralelo string
		rows.Scan(&anio, &materia, &curso, &paralelo)
		history = append(history, map[string]interface{}{
			"anio":     anio,
			"materia":  materia,
			"curso":    curso,
			"paralelo": paralelo,
		})
	}

	return history, nil
}

// validarCedulaEcuador valida si una cédula ecuatoriana es válida
func validarCedulaEcuador(cedula string) bool {
	if len(cedula) != 10 {
		return false
	}

	// Verificar que sean solo dígitos
	if _, err := strconv.Atoi(cedula); err != nil {
		return false
	}

	provincia, _ := strconv.Atoi(cedula[0:2])
	if provincia < 1 || provincia > 24 {
		return false
	}

	tercerDigito, _ := strconv.Atoi(string(cedula[2]))
	if tercerDigito >= 6 {
		return false
	}

	coeficientes := []int{2, 1, 2, 1, 2, 1, 2, 1, 2}
	total := 0

	for i := 0; i < 9; i++ {
		digito, _ := strconv.Atoi(string(cedula[i]))
		valor := digito * coeficientes[i]
		if valor >= 10 {
			valor -= 9
		}
		total += valor
	}

	decenaSuperior := (total + 9) / 10 * 10
	digitoVerificador := decenaSuperior - total
	if digitoVerificador == 10 {
		digitoVerificador = 0
	}

	ultimoDigito, _ := strconv.Atoi(string(cedula[9]))
	return digitoVerificador == ultimoDigito
}
