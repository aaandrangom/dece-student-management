package student

import (
	"dece/internal/domain/academic"
	"dece/internal/domain/student"
	"dece/internal/domain/welfare"
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

type StudentService struct {
	db *gorm.DB
}

func NewStudentService(db *gorm.DB) *StudentService {
	return &StudentService{db: db}
}

type FamiliarDTO struct {
	Cedula           string `json:"cedula"`
	Nombres          string `json:"nombres"`
	Telefono         string `json:"telefono"`
	Profesion        string `json:"profesion"`
	LugarTrabajo     string `json:"lugar_trabajo"`
	NivelInstruccion string `json:"nivel_instruccion"`
}

type EnrollmentDTO struct {
	Cedula          string `json:"cedula"`
	Apellidos       string `json:"apellidos"`
	Nombres         string `json:"nombres"`
	FechaNacimiento string `json:"fecha_nacimiento"`
	Genero          string `json:"genero"`
	Nacionalidad    string `json:"nacionalidad"`
	Direccion       string `json:"direccion"`
	Telefono        string `json:"telefono"`

	AulaID                 uint   `json:"aula_id"`
	EsRepetidor            bool   `json:"es_repetidor"`
	InstitucionProcedencia string `json:"institucion_procedencia"`

	Padre            FamiliarDTO `json:"padre"`
	Madre            FamiliarDTO `json:"madre"`
	Representante    FamiliarDTO `json:"representante"`
	RepresentanteRol string      `json:"representante_rol"`

	Peso                 float64 `json:"peso"`
	Talla                float64 `json:"talla"`
	Discapacidad         bool    `json:"discapacidad"`
	DetallesDiscapacidad string  `json:"detalles_discapacidad"`
}

type StudentListDTO struct {
	ID                uint   `json:"id"`
	Cedula            string `json:"cedula"`
	Apellidos         string `json:"apellidos"`
	Nombres           string `json:"nombres"`
	Curso             string `json:"curso"`
	Paralelo          string `json:"paralelo"`
	AnioLectivo       string `json:"anio_lectivo"`
	TieneDiscapacidad bool   `json:"tiene_discapacidad"`
	TieneCasoDECE     bool   `json:"tiene_caso_dece"`
	EsRepetidor       bool   `json:"es_repetidor"`
	FotoPerfil        string `json:"foto_perfil"`
	Estado            string `json:"estado"`
	MotivoRetiro      string `json:"motivo_retiro"`
	FechaRetiro       string `json:"fecha_retiro"`
}

type StudentListResponse struct {
	Data  []StudentListDTO `json:"data"`
	Total int64            `json:"total"`
	Page  int              `json:"page"`
}

func (s *StudentService) GetStudents(anioID uint, cursoID uint, paraleloID uint, query string, page int, pageSize int) (*StudentListResponse, error) {
	var students []StudentListDTO
	var total int64
	offset := (page - 1) * pageSize

	dbQuery := s.db.Table("estudiantes").
		Select(`
			estudiantes.id, 
			estudiantes.cedula, 
			estudiantes.apellidos, 
			estudiantes.nombres, 
			estudiantes.foto_perfil_path as foto_perfil,
			cursos.nombre as curso, 
			paralelos.nombre as paralelo,
			anio_lectivos.nombre as anio_lectivo,
			historial_academicos.ha_repetido as es_repetidor,
			historial_academicos.estado,
			historial_academicos.motivo_retiro,
			historial_academicos.fecha_retiro
		`).
		Joins("LEFT JOIN historial_academicos ON historial_academicos.estudiante_id = estudiantes.id").
		Joins("LEFT JOIN aulas ON aulas.id = historial_academicos.aula_id").
		Joins("LEFT JOIN cursos ON cursos.id = aulas.curso_id").
		Joins("LEFT JOIN paralelos ON paralelos.id = aulas.paralelo_id").
		Joins("LEFT JOIN anio_lectivos ON anio_lectivos.id = aulas.anio_lectivo_id")

	if query != "" {
		search := "%" + strings.ToUpper(query) + "%"
		dbQuery = dbQuery.Where("estudiantes.cedula LIKE ? OR UPPER(estudiantes.apellidos) LIKE ? OR UPPER(estudiantes.nombres) LIKE ?", search, search, search)

		dbQuery = dbQuery.Order("anio_lectivos.id DESC")
	} else {
		if anioID > 0 {
			dbQuery = dbQuery.Where("aulas.anio_lectivo_id = ?", anioID)
		}
		if cursoID > 0 {
			dbQuery = dbQuery.Where("aulas.curso_id = ?", cursoID)
		}
		if paraleloID > 0 {
			dbQuery = dbQuery.Where("aulas.paralelo_id = ?", paraleloID)
		}
		dbQuery = dbQuery.Order("estudiantes.apellidos ASC, estudiantes.nombres ASC")
	}

	if query != "" {
		dbQuery = dbQuery.Group("estudiantes.id")
	}

	if query != "" {
		var count int64
		s.db.Table("(?) as sub", dbQuery).Count(&count)
		total = count
	} else {
		dbQuery.Count(&total)
	}

	err := dbQuery.Limit(pageSize).Offset(offset).Scan(&students).Error
	if err != nil {
		return nil, err
	}

	for i := range students {
		var salud welfare.SaludVulnerabilidad
		s.db.Table("salud_vulnerabilidads").
			Joins("JOIN historial_academicos ON historial_academicos.id = salud_vulnerabilidads.historial_id").
			Where("historial_academicos.estudiante_id = ?", students[i].ID).
			Order("historial_academicos.id DESC").
			Limit(1).
			Scan(&salud)

		students[i].TieneDiscapacidad = salud.Discapacidad

		var countCasos int64
		s.db.Table("disciplina_casos").
			Joins("JOIN historial_academicos ON historial_academicos.id = disciplina_casos.historial_id").
			Where("historial_academicos.estudiante_id = ? AND disciplina_casos.estado = 'ABIERTO'", students[i].ID).
			Count(&countCasos)

		students[i].TieneCasoDECE = countCasos > 0
	}

	return &StudentListResponse{
		Data:  students,
		Total: total,
		Page:  page,
	}, nil
}

func (s *StudentService) ExportStudentsToExcel(anioID uint, cursoID uint, paraleloID uint) (string, error) {
	resp, err := s.GetStudents(anioID, cursoID, paraleloID, "", 1, 10000)
	if err != nil {
		return "", err
	}

	f := excelize.NewFile()
	sheetName := "Estudiantes"
	f.SetSheetName("Sheet1", sheetName)

	headers := []string{"Cédula", "Apellidos", "Nombres", "Curso", "Paralelo", "Discapacidad", "Caso DECE", "Repetidor"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, h)
	}

	style, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true}})
	f.SetCellStyle(sheetName, "A1", "H1", style)

	for i, st := range resp.Data {
		row := i + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), st.Cedula)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), st.Apellidos)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), st.Nombres)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), st.Curso)
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), st.Paralelo)

		disc := "NO"
		if st.TieneDiscapacidad {
			disc = "SI"
		}
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), disc)

		dece := "NO"
		if st.TieneCasoDECE {
			dece = "SI"
		}
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), dece)

		rep := "NO"
		if st.EsRepetidor {
			rep = "SI"
		}
		f.SetCellValue(sheetName, fmt.Sprintf("H%d", row), rep)
	}

	buffer, err := f.WriteToBuffer()
	if err != nil {
		return "", err
	}

	encoded := base64.StdEncoding.EncodeToString(buffer.Bytes())
	return encoded, nil
}

func (s *StudentService) EnrollNewStudent(data EnrollmentDTO) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		fechaNac, _ := time.Parse("2006-01-02", data.FechaNacimiento)
		estudiante := student.Estudiante{
			Cedula:          data.Cedula,
			Apellidos:       strings.ToUpper(data.Apellidos),
			Nombres:         strings.ToUpper(data.Nombres),
			FechaNacimiento: fechaNac,
			Genero:          data.Genero,
			Nacionalidad:    data.Nacionalidad,
		}

		if err := tx.Create(&estudiante).Error; err != nil {
			return fmt.Errorf("error al crear estudiante: %v", err)
		}

		historial := student.HistorialAcademico{
			EstudianteID:           estudiante.ID,
			AulaID:                 data.AulaID,
			DireccionDomicilio:     data.Direccion,
			TelefonoContacto:       data.Telefono,
			EsNuevo:                true,
			InstitucionProcedencia: data.InstitucionProcedencia,
			HaRepetido:             data.EsRepetidor,
			Peso:                   data.Peso,
			Talla:                  data.Talla,
		}

		if err := tx.Create(&historial).Error; err != nil {
			return fmt.Errorf("error al crear historial: %v", err)
		}

		if data.Padre.Nombres != "" {
			padre := student.Familiar{
				EstudianteID:     estudiante.ID,
				Rol:              "PADRE",
				Cedula:           data.Padre.Cedula,
				NombresCompletos: strings.ToUpper(data.Padre.Nombres),
				Telefono:         data.Padre.Telefono,
				Profesion:        data.Padre.Profesion,
				LugarTrabajo:     data.Padre.LugarTrabajo,
				NivelInstruccion: data.Padre.NivelInstruccion,
			}
			if err := tx.Create(&padre).Error; err != nil {
				return err
			}
		}

		if data.Madre.Nombres != "" {
			madre := student.Familiar{
				EstudianteID:     estudiante.ID,
				Rol:              "MADRE",
				Cedula:           data.Madre.Cedula,
				NombresCompletos: strings.ToUpper(data.Madre.Nombres),
				Telefono:         data.Madre.Telefono,
				Profesion:        data.Madre.Profesion,
				LugarTrabajo:     data.Madre.LugarTrabajo,
				NivelInstruccion: data.Madre.NivelInstruccion,
			}
			if err := tx.Create(&madre).Error; err != nil {
				return err
			}
		}

		switch data.RepresentanteRol {
		case "PADRE":
			if err := tx.Model(&student.Familiar{}).Where("estudiante_id = ? AND rol = 'PADRE'", estudiante.ID).Update("es_representante_legal", true).Error; err != nil {
				return errors.New("el padre no está registrado para ser representante")
			}
		case "MADRE":
			if err := tx.Model(&student.Familiar{}).Where("estudiante_id = ? AND rol = 'MADRE'", estudiante.ID).Update("es_representante_legal", true).Error; err != nil {
				return errors.New("la madre no está registrada para ser representante")
			}
		default:
			rep := student.Familiar{
				EstudianteID:         estudiante.ID,
				Rol:                  "REPRESENTANTE",
				Cedula:               data.Representante.Cedula,
				NombresCompletos:     strings.ToUpper(data.Representante.Nombres),
				Telefono:             data.Representante.Telefono,
				Profesion:            data.Representante.Profesion,
				LugarTrabajo:         data.Representante.LugarTrabajo,
				NivelInstruccion:     data.Representante.NivelInstruccion,
				EsRepresentanteLegal: true,
			}
			if err := tx.Create(&rep).Error; err != nil {
				return err
			}
		}

		salud := welfare.SaludVulnerabilidad{
			HistorialID:          historial.ID,
			Discapacidad:         data.Discapacidad,
			DetallesDiscapacidad: data.DetallesDiscapacidad,
		}
		if err := tx.Create(&salud).Error; err != nil {
			return fmt.Errorf("error al crear ficha de salud: %v", err)
		}

		return nil
	})
}

func (s *StudentService) GetStudentByCedula(cedula string) (*EnrollmentDTO, error) {
	var est student.Estudiante
	if err := s.db.Where("cedula = ?", cedula).First(&est).Error; err != nil {
		return nil, err
	}

	var lastHist student.HistorialAcademico
	s.db.Where("estudiante_id = ?", est.ID).Order("id desc").First(&lastHist)

	var familiares []student.Familiar
	s.db.Where("estudiante_id = ?", est.ID).Find(&familiares)

	var salud welfare.SaludVulnerabilidad
	if lastHist.ID != 0 {
		s.db.Where("historial_id = ?", lastHist.ID).First(&salud)
	}

	dto := &EnrollmentDTO{
		Cedula:                 est.Cedula,
		Apellidos:              est.Apellidos,
		Nombres:                est.Nombres,
		FechaNacimiento:        est.FechaNacimiento.Format("2006-01-02"),
		Genero:                 est.Genero,
		Nacionalidad:           est.Nacionalidad,
		Direccion:              lastHist.DireccionDomicilio,
		Telefono:               lastHist.TelefonoContacto,
		EsRepetidor:            false,
		InstitucionProcedencia: lastHist.InstitucionProcedencia,
		Peso:                   lastHist.Peso,
		Talla:                  lastHist.Talla,
		Discapacidad:           salud.Discapacidad,
		DetallesDiscapacidad:   salud.DetallesDiscapacidad,
	}

	for _, f := range familiares {
		famDTO := FamiliarDTO{
			Cedula:           f.Cedula,
			Nombres:          f.NombresCompletos,
			Telefono:         f.Telefono,
			Profesion:        f.Profesion,
			LugarTrabajo:     f.LugarTrabajo,
			NivelInstruccion: f.NivelInstruccion,
		}

		switch f.Rol {
		case "PADRE":
			dto.Padre = famDTO
			if f.EsRepresentanteLegal {
				dto.RepresentanteRol = "PADRE"
			}
		case "MADRE":
			dto.Madre = famDTO
			if f.EsRepresentanteLegal {
				dto.RepresentanteRol = "MADRE"
			}
		case "REPRESENTANTE":
			dto.Representante = famDTO
			dto.RepresentanteRol = "OTRO"
		}
	}

	return dto, nil
}

func (s *StudentService) EnrollExistingStudent(data EnrollmentDTO) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		var estudiante student.Estudiante
		if err := tx.Where("cedula = ?", data.Cedula).First(&estudiante).Error; err != nil {
			return fmt.Errorf("estudiante no encontrado: %v", err)
		}

		fechaNac, _ := time.Parse("2006-01-02", data.FechaNacimiento)
		estudiante.Apellidos = strings.ToUpper(data.Apellidos)
		estudiante.Nombres = strings.ToUpper(data.Nombres)
		estudiante.FechaNacimiento = fechaNac
		estudiante.Genero = data.Genero
		estudiante.Nacionalidad = data.Nacionalidad

		if err := tx.Save(&estudiante).Error; err != nil {
			return fmt.Errorf("error al actualizar estudiante: %v", err)
		}

		historial := student.HistorialAcademico{
			EstudianteID:           estudiante.ID,
			AulaID:                 data.AulaID,
			DireccionDomicilio:     data.Direccion,
			TelefonoContacto:       data.Telefono,
			EsNuevo:                false,
			InstitucionProcedencia: data.InstitucionProcedencia,
			HaRepetido:             data.EsRepetidor,
			Peso:                   data.Peso,
			Talla:                  data.Talla,
		}

		if err := tx.Create(&historial).Error; err != nil {
			return fmt.Errorf("error al crear historial: %v", err)
		}

		updateOrCreateFamiliar := func(rol string, famData FamiliarDTO) error {
			if famData.Nombres == "" {
				return nil
			}

			var fam student.Familiar
			err := tx.Where("estudiante_id = ? AND rol = ?", estudiante.ID, rol).First(&fam).Error

			if err == nil {
				fam.Cedula = famData.Cedula
				fam.NombresCompletos = strings.ToUpper(famData.Nombres)
				fam.Telefono = famData.Telefono
				fam.Profesion = famData.Profesion
				fam.LugarTrabajo = famData.LugarTrabajo
				fam.NivelInstruccion = famData.NivelInstruccion
				return tx.Save(&fam).Error
			} else if errors.Is(err, gorm.ErrRecordNotFound) {
				newFam := student.Familiar{
					EstudianteID:     estudiante.ID,
					Rol:              rol,
					Cedula:           famData.Cedula,
					NombresCompletos: strings.ToUpper(famData.Nombres),
					Telefono:         famData.Telefono,
					Profesion:        famData.Profesion,
					LugarTrabajo:     famData.LugarTrabajo,
					NivelInstruccion: famData.NivelInstruccion,
				}
				return tx.Create(&newFam).Error
			} else {
				return err
			}
		}

		if err := updateOrCreateFamiliar("PADRE", data.Padre); err != nil {
			return err
		}
		if err := updateOrCreateFamiliar("MADRE", data.Madre); err != nil {
			return err
		}

		if err := tx.Model(&student.Familiar{}).Where("estudiante_id = ?", estudiante.ID).Update("es_representante_legal", false).Error; err != nil {
			return err
		}

		switch data.RepresentanteRol {
		case "PADRE":
			if err := tx.Model(&student.Familiar{}).Where("estudiante_id = ? AND rol = 'PADRE'", estudiante.ID).Update("es_representante_legal", true).Error; err != nil {
				return errors.New("error asignando representante padre")
			}
		case "MADRE":
			if err := tx.Model(&student.Familiar{}).Where("estudiante_id = ? AND rol = 'MADRE'", estudiante.ID).Update("es_representante_legal", true).Error; err != nil {
				return errors.New("error asignando representante madre")
			}
		default:
			if err := updateOrCreateFamiliar("REPRESENTANTE", data.Representante); err != nil {
				return err
			}

			if err := tx.Model(&student.Familiar{}).Where("estudiante_id = ? AND rol = 'REPRESENTANTE'", estudiante.ID).Update("es_representante_legal", true).Error; err != nil {
				return err
			}
		}

		salud := welfare.SaludVulnerabilidad{
			HistorialID:          historial.ID,
			Discapacidad:         data.Discapacidad,
			DetallesDiscapacidad: data.DetallesDiscapacidad,
		}
		if err := tx.Create(&salud).Error; err != nil {
			return fmt.Errorf("error al crear ficha de salud: %v", err)
		}

		return nil
	})
}

type AnioLectivoSimpleDTO struct {
	ID     uint   `json:"id"`
	Nombre string `json:"nombre"`
	Activo bool   `json:"activo"`
}

type StudentProfileDTO struct {
	Estudiante       student.Estudiante           `json:"estudiante"`
	HistorialActual  *student.HistorialAcademico  `json:"historial_actual"`
	Familiares       []student.Familiar           `json:"familiares"`
	Salud            *welfare.SaludVulnerabilidad `json:"salud"`
	AniosDisponibles []AnioLectivoSimpleDTO       `json:"anios_disponibles"`
}

func (s *StudentService) GetStudentProfile(estudianteID uint, anioLectivoID uint) (*StudentProfileDTO, error) {
	var profile StudentProfileDTO

	if err := s.db.First(&profile.Estudiante, estudianteID).Error; err != nil {
		return nil, fmt.Errorf("estudiante no encontrado")
	}

	s.db.Where("estudiante_id = ?", estudianteID).Find(&profile.Familiares)

	type AnioResult struct {
		ID     uint
		Nombre string
		Activo bool
	}
	var anios []AnioResult
	s.db.Table("historial_academicos").
		Select("DISTINCT anio_lectivos.id AS id, anio_lectivos.nombre AS nombre, anio_lectivos.activo AS activo").
		Joins("JOIN aulas ON historial_academicos.aula_id = aulas.id").
		Joins("JOIN anio_lectivos ON aulas.anio_lectivo_id = anio_lectivos.id").
		Where("historial_academicos.estudiante_id = ?", estudianteID).
		Order("anio_lectivos.id DESC").
		Scan(&anios)

	for _, a := range anios {
		profile.AniosDisponibles = append(profile.AniosDisponibles, AnioLectivoSimpleDTO{
			ID:     a.ID,
			Nombre: a.Nombre,
			Activo: a.Activo,
		})
	}

	if len(profile.AniosDisponibles) == 0 {
		var anioActivo academic.AnioLectivo
		if err := s.db.Where("activo = ?", true).First(&anioActivo).Error; err == nil {
			profile.AniosDisponibles = append(profile.AniosDisponibles, AnioLectivoSimpleDTO{
				ID:     anioActivo.ID,
				Nombre: anioActivo.Nombre,
				Activo: anioActivo.Activo,
			})
		}
	}

	var historial student.HistorialAcademico
	query := s.db.Preload("Aula").
		Preload("Aula.Curso").
		Preload("Aula.Paralelo").
		Preload("Aula.AnioLectivo").
		Preload("Aula.TutorDocente").
		Where("estudiante_id = ?", estudianteID)

	if anioLectivoID != 0 {
		query = query.Joins("JOIN aulas ON historial_academicos.aula_id = aulas.id").
			Where("aulas.anio_lectivo_id = ?", anioLectivoID)
	} else {
		query = query.Order("id desc")
	}

	err := query.First(&historial).Error
	if err == nil {
		profile.HistorialActual = &historial

		var salud welfare.SaludVulnerabilidad
		if err := s.db.Where("historial_id = ?", historial.ID).First(&salud).Error; err == nil {
			profile.Salud = &salud
		}
	}

	return &profile, nil
}

type AulaOptionDTO struct {
	ID       uint   `json:"id"`
	Paralelo string `json:"paralelo"`
}

func (s *StudentService) GetAlternativeAulas(historialID uint) ([]AulaOptionDTO, error) {
	var historial student.HistorialAcademico
	if err := s.db.Preload("Aula").First(&historial, historialID).Error; err != nil {
		return nil, err
	}

	var aulas []academic.Aula
	if err := s.db.Preload("Paralelo").
		Where("anio_lectivo_id = ? AND curso_id = ? AND id != ?",
			historial.Aula.AnioLectivoID, historial.Aula.CursoID, historial.Aula.ID).
		Find(&aulas).Error; err != nil {
		return nil, err
	}

	options := []AulaOptionDTO{}
	for _, a := range aulas {
		options = append(options, AulaOptionDTO{
			ID:       a.ID,
			Paralelo: a.Paralelo.Nombre,
		})
	}
	return options, nil
}

func (s *StudentService) ChangeStudentParallel(historialID uint, targetAulaID uint) error {
	return s.db.Model(&student.HistorialAcademico{}).
		Where("id = ?", historialID).
		Update("aula_id", targetAulaID).Error
}

func (s *StudentService) WithdrawStudent(historialID uint, motivo string, fecha time.Time) error {
	return s.db.Model(&student.HistorialAcademico{}).
		Where("id = ?", historialID).
		Updates(map[string]interface{}{
			"estado":        "RETIRADO",
			"motivo_retiro": motivo,
			"fecha_retiro":  fecha,
		}).Error
}

func (s *StudentService) UpdateStudentPhoto(estudianteID uint, photoBase64 string) error {
	parts := strings.Split(photoBase64, ",")
	if len(parts) != 2 {
		return fmt.Errorf("formato de imagen inválido")
	}

	data, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return fmt.Errorf("error al decodificar imagen: %v", err)
	}

	uploadDir := "uploads/photos"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return fmt.Errorf("error al crear directorio: %v", err)
	}

	filename := fmt.Sprintf("student_%d_%d.jpg", estudianteID, time.Now().Unix())
	filePath := filepath.Join(uploadDir, filename)

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return fmt.Errorf("error al guardar archivo: %v", err)
	}

	absPath, _ := filepath.Abs(filePath)

	return s.db.Model(&student.Estudiante{}).
		Where("id = ?", estudianteID).
		Update("foto_perfil_path", absPath).Error
}

type WithdrawnStudentDTO struct {
	ID           uint      `json:"id"`
	Cedula       string    `json:"cedula"`
	Apellidos    string    `json:"apellidos"`
	Nombres      string    `json:"nombres"`
	Curso        string    `json:"curso"`
	Paralelo     string    `json:"paralelo"`
	FechaRetiro  time.Time `json:"fecha_retiro"`
	MotivoRetiro string    `json:"motivo_retiro"`
	FotoPerfil   string    `json:"foto_perfil"`
}

type WithdrawnStudentListResponse struct {
	Data  []WithdrawnStudentDTO `json:"data"`
	Total int64                 `json:"total"`
	Page  int                   `json:"page"`
}

func (s *StudentService) GetWithdrawnStudents(anioID uint, queryStr string, page int, pageSize int) (*WithdrawnStudentListResponse, error) {
	var students []WithdrawnStudentDTO
	var total int64
	offset := (page - 1) * pageSize

	dbQuery := s.db.Table("estudiantes").
		Select(`
			estudiantes.id, 
			estudiantes.cedula, 
			estudiantes.apellidos, 
			estudiantes.nombres, 
			estudiantes.foto_perfil_path as foto_perfil,
			cursos.nombre as curso, 
			paralelos.nombre as paralelo,
			historial_academicos.fecha_retiro,
			historial_academicos.motivo_retiro
		`).
		Joins("JOIN historial_academicos ON estudiantes.id = historial_academicos.estudiante_id").
		Joins("JOIN aulas ON historial_academicos.aula_id = aulas.id").
		Joins("JOIN cursos ON aulas.curso_id = cursos.id").
		Joins("JOIN paralelos ON aulas.paralelo_id = paralelos.id").
		Where("historial_academicos.estado = ?", "RETIRADO")

	if anioID != 0 {
		dbQuery = dbQuery.Where("aulas.anio_lectivo_id = ?", anioID)
	}

	if queryStr != "" {
		term := "%" + queryStr + "%"
		dbQuery = dbQuery.Where("(estudiantes.cedula LIKE ? OR estudiantes.apellidos LIKE ? OR estudiantes.nombres LIKE ?)", term, term, term)
	}

	if err := dbQuery.Count(&total).Error; err != nil {
		return nil, err
	}

	if err := dbQuery.Order("historial_academicos.fecha_retiro DESC").
		Limit(pageSize).
		Offset(offset).
		Scan(&students).Error; err != nil {
		return nil, err
	}

	return &WithdrawnStudentListResponse{
		Data:  students,
		Total: total,
		Page:  page,
	}, nil
}
