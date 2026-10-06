// Package periodo centraliza qué periodo lectivo se consulta y cuál se puede modificar.
//
//   - Periodo activo (año de trabajo): periodo_lectivos.es_activo. Todo lo nuevo se registra ahí.
//   - Periodo en consulta: el año que el usuario está viendo. Vive solo en memoria, así que al
//     reiniciar la app se vuelve al año de trabajo. Las lecturas usan ConsultaID.
//
// Las escrituras validan con ValidarEditable: solo el periodo activo y no cerrado acepta cambios.
package periodo

import (
	"errors"
	"sync"

	"gorm.io/gorm"
)

var (
	mu         sync.RWMutex
	consultaID uint // 0 = consultando el periodo activo
)

// ActivoID devuelve el ID del periodo activo, o 0 si no hay ninguno.
func ActivoID(db *gorm.DB) (uint, error) {
	var ids []uint
	if err := db.Table("periodo_lectivos").Where("es_activo = ?", true).Limit(1).Pluck("id", &ids).Error; err != nil {
		return 0, err
	}
	if len(ids) == 0 {
		return 0, nil
	}
	return ids[0], nil
}

// ConsultaID devuelve el periodo que se está viendo: el elegido en el selector o, si no hay
// ninguno (o ya no existe), el periodo activo. Puede ser 0 si no hay periodo activo.
func ConsultaID(db *gorm.DB) (uint, error) {
	mu.RLock()
	id := consultaID
	mu.RUnlock()

	if id > 0 {
		var count int64
		if err := db.Table("periodo_lectivos").Where("id = ?", id).Count(&count).Error; err != nil {
			return 0, err
		}
		if count > 0 {
			return id, nil
		}
		SetConsulta(0)
	}
	return ActivoID(db)
}

// SetConsulta cambia el periodo en consulta; 0 vuelve al periodo activo.
func SetConsulta(id uint) {
	mu.Lock()
	consultaID = id
	mu.Unlock()
}

// ValidarEditable rechaza cambios en periodos que no son el activo o que están cerrados.
func ValidarEditable(db *gorm.DB, periodoID uint) error {
	var p struct {
		EsActivo bool
		Cerrado  bool
	}
	err := db.Table("periodo_lectivos").Select("es_activo, cerrado").Where("id = ?", periodoID).Take(&p).Error
	if err != nil {
		return errors.New("El periodo lectivo no existe")
	}
	if p.Cerrado {
		return errors.New("El periodo lectivo está cerrado: solo se permite consultar")
	}
	if !p.EsActivo {
		return errors.New("Solo se pueden registrar cambios en el periodo lectivo activo")
	}
	return nil
}

// ValidarActivoEditable valida el periodo activo; error si no hay ninguno.
func ValidarActivoEditable(db *gorm.DB) (uint, error) {
	id, err := ActivoID(db)
	if err != nil {
		return 0, err
	}
	if id == 0 {
		return 0, errors.New("No hay un periodo lectivo activo")
	}
	return id, ValidarEditable(db, id)
}

// ValidarCursoEditable valida el periodo al que pertenece el curso.
func ValidarCursoEditable(db *gorm.DB, cursoID uint) error {
	var periodoID uint
	if err := db.Table("cursos").Select("periodo_id").Where("id = ?", cursoID).Take(&periodoID).Error; err != nil {
		return errors.New("El curso no existe")
	}
	return ValidarEditable(db, periodoID)
}

// ValidarMatriculaEditable valida el periodo al que pertenece la matrícula.
func ValidarMatriculaEditable(db *gorm.DB, matriculaID uint) error {
	var periodoID uint
	err := db.Table("matriculas").
		Select("cursos.periodo_id").
		Joins("JOIN cursos ON cursos.id = matriculas.curso_id").
		Where("matriculas.id = ?", matriculaID).
		Take(&periodoID).Error
	if err != nil {
		return errors.New("La matrícula no existe")
	}
	return ValidarEditable(db, periodoID)
}
