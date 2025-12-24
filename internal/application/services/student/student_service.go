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

// DTOs
type FamiliarDTO struct {
	Cedula           string `json:"cedula"`
	Nombres          string `json:"nombres"`
	Telefono         string `json:"telefono"`
	Profesion        string `json:"profesion"`
	LugarTrabajo     string `json:"lugar_trabajo"`
	NivelInstruccion string `json:"nivel_instruccion"`
}

type EnrollmentDTO struct {
	// Estudiante
	Cedula          string `json:"cedula"`
	Apellidos       string `json:"apellidos"`
	Nombres         string `json:"nombres"`
	FechaNacimiento string `json:"fecha_nacimiento"`
	Genero          string `json:"genero"`
	Nacionalidad    string `json:"nacionalidad"`
	Direccion       string `json:"direccion"`
	Telefono        string `json:"telefono"`

	// Academico
	AulaID                 uint   `json:"aula_id"`
	EsRepetidor            bool   `json:"es_repetidor"`
	InstitucionProcedencia string `json:"institucion_procedencia"`

	// Familiares
	Padre            FamiliarDTO `json:"padre"`
	Madre            FamiliarDTO `json:"madre"`
	Representante    FamiliarDTO `json:"representante"`
	RepresentanteRol string      `json:"representante_rol"` // PADRE, MADRE, OTRO

	// Salud
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
	AnioLectivo       string `json:"anio_lectivo"` // Para búsquedas globales
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

// GetStudents obtiene el listado de estudiantes con filtros y paginación
func (s *StudentService) GetStudents(anioID uint, cursoID uint, paraleloID uint, query string, page int, pageSize int) (*StudentListResponse, error) {
	var students []StudentListDTO
	var total int64
	offset := (page - 1) * pageSize

	// Base query
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

	// Lógica de filtrado
	if query != "" {
		// Búsqueda Global: Busca por cédula o nombre en TODA la base
		// Priorizamos mostrar el historial más reciente si hay duplicados por múltiples años
		// Pero para simplificar en SQL, filtramos por el query
		search := "%" + strings.ToUpper(query) + "%"
		dbQuery = dbQuery.Where("estudiantes.cedula LIKE ? OR UPPER(estudiantes.apellidos) LIKE ? OR UPPER(estudiantes.nombres) LIKE ?", search, search, search)

		// Si hay búsqueda global, ordenamos por año lectivo descendente para ver lo más reciente
		dbQuery = dbQuery.Order("anio_lectivos.id DESC")
	} else {
		// Listado Filtrado por Año (Default)
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

	// Contar total antes de paginar
	// Nota: Al hacer joins con historiales, un estudiante puede salir varias veces si buscamos globalmente.
	// Para el listado del año actual (query vacio), es 1:1.
	// Para búsqueda global, podríamos agrupar por estudiante.id
	if query != "" {
		dbQuery = dbQuery.Group("estudiantes.id")
	}

	// Ejecutar Count
	// GORM Count con Group By puede ser tricky, usamos una subquery o count simple si no hay group
	if query != "" {
		// Count con group by es complejo en GORM directo, simplificamos contando los resultados
		// Esto no es eficiente para millones de registros, pero ok para miles.
		var count int64
		s.db.Table("(?) as sub", dbQuery).Count(&count)
		total = count
	} else {
		dbQuery.Count(&total)
	}

	// Paginación
	err := dbQuery.Limit(pageSize).Offset(offset).Scan(&students).Error
	if err != nil {
		return nil, err
	}

	// Enriquecer con indicadores (Discapacidad, Casos DECE)
	// Esto se hace en memoria para evitar joins complejos y lentos en la query principal
	for i := range students {
		// 1. Discapacidad (Buscar en salud_vulnerabilidad vinculado a CUALQUIER historial del estudiante?
		// O solo el actual? Generalmente es una condición del estudiante.
		// Buscamos el último registro de salud
		var salud welfare.SaludVulnerabilidad
		// Buscamos a través de los historiales del estudiante
		s.db.Table("salud_vulnerabilidads").
			Joins("JOIN historial_academicos ON historial_academicos.id = salud_vulnerabilidads.historial_id").
			Where("historial_academicos.estudiante_id = ?", students[i].ID).
			Order("historial_academicos.id DESC").
			Limit(1).
			Scan(&salud)

		students[i].TieneDiscapacidad = salud.Discapacidad

		// 2. Casos DECE Abiertos
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

// ExportStudentsToExcel genera un archivo Excel con los estudiantes filtrados
func (s *StudentService) ExportStudentsToExcel(anioID uint, cursoID uint, paraleloID uint) (string, error) {
	// Obtener todos los estudiantes sin paginación
	resp, err := s.GetStudents(anioID, cursoID, paraleloID, "", 1, 10000) // Limit alto
	if err != nil {
		return "", err
	}

	f := excelize.NewFile()
	sheetName := "Estudiantes"
	f.SetSheetName("Sheet1", sheetName)

	// Encabezados
	headers := []string{"Cédula", "Apellidos", "Nombres", "Curso", "Paralelo", "Discapacidad", "Caso DECE", "Repetidor"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, h)
	}

	// Estilo Negrita para encabezado
	style, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true}})
	f.SetCellStyle(sheetName, "A1", "H1", style)

	// Datos
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

	// Guardar en temporal o devolver base64?
	// Wails maneja bien base64 para descargas, o guardar en disco.
	// Vamos a devolver base64 string para que el front lo descargue
	buffer, err := f.WriteToBuffer()
	if err != nil {
		return "", err
	}

	// Convertir a Base64
	encoded := base64.StdEncoding.EncodeToString(buffer.Bytes())
	return encoded, nil
}

// EnrollNewStudent registra un estudiante nuevo (Caso A)
func (s *StudentService) EnrollNewStudent(data EnrollmentDTO) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		// 1. Crear Estudiante
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

		// 2. Crear Historial Académico
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

		// 3. Crear Familiares
		// Padre
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

		// Madre
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

		// Representante
		// Si el rol es PADRE o MADRE, actualizamos el flag en el registro existente
		// Si es OTRO, creamos uno nuevo
		if data.RepresentanteRol == "PADRE" {
			if err := tx.Model(&student.Familiar{}).Where("estudiante_id = ? AND rol = 'PADRE'", estudiante.ID).Update("es_representante_legal", true).Error; err != nil {
				return errors.New("el padre no está registrado para ser representante")
			}
		} else if data.RepresentanteRol == "MADRE" {
			if err := tx.Model(&student.Familiar{}).Where("estudiante_id = ? AND rol = 'MADRE'", estudiante.ID).Update("es_representante_legal", true).Error; err != nil {
				return errors.New("la madre no está registrada para ser representante")
			}
		} else {
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

		// 4. Salud Base
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

// GetStudentByCedula busca un estudiante para re-matriculación
func (s *StudentService) GetStudentByCedula(cedula string) (*EnrollmentDTO, error) {
	var est student.Estudiante
	if err := s.db.Where("cedula = ?", cedula).First(&est).Error; err != nil {
		return nil, err
	}

	// Obtener último historial para datos de contacto y salud previos
	var lastHist student.HistorialAcademico
	s.db.Where("estudiante_id = ?", est.ID).Order("id desc").First(&lastHist)

	// Obtener familiares
	var familiares []student.Familiar
	s.db.Where("estudiante_id = ?", est.ID).Find(&familiares)

	// Obtener salud del último historial
	var salud welfare.SaludVulnerabilidad
	if lastHist.ID != 0 {
		s.db.Where("historial_id = ?", lastHist.ID).First(&salud)
	}

	// Mapear a DTO
	dto := &EnrollmentDTO{
		Cedula:          est.Cedula,
		Apellidos:       est.Apellidos,
		Nombres:         est.Nombres,
		FechaNacimiento: est.FechaNacimiento.Format("2006-01-02"),
		Genero:          est.Genero,
		Nacionalidad:    est.Nacionalidad,
		Direccion:       lastHist.DireccionDomicilio,
		Telefono:        lastHist.TelefonoContacto,
		// Academico (Se dejan vacíos o defaults para la nueva matrícula)
		EsRepetidor:            false, // Por defecto false en nueva matrícula
		InstitucionProcedencia: lastHist.InstitucionProcedencia,
		// Salud
		Peso:                 lastHist.Peso,
		Talla:                lastHist.Talla,
		Discapacidad:         salud.Discapacidad,
		DetallesDiscapacidad: salud.DetallesDiscapacidad,
	}

	// Mapear Familiares
	for _, f := range familiares {
		famDTO := FamiliarDTO{
			Cedula:           f.Cedula,
			Nombres:          f.NombresCompletos,
			Telefono:         f.Telefono,
			Profesion:        f.Profesion,
			LugarTrabajo:     f.LugarTrabajo,
			NivelInstruccion: f.NivelInstruccion,
		}

		if f.Rol == "PADRE" {
			dto.Padre = famDTO
			if f.EsRepresentanteLegal {
				dto.RepresentanteRol = "PADRE"
			}
		} else if f.Rol == "MADRE" {
			dto.Madre = famDTO
			if f.EsRepresentanteLegal {
				dto.RepresentanteRol = "MADRE"
			}
		} else if f.Rol == "REPRESENTANTE" {
			dto.Representante = famDTO
			dto.RepresentanteRol = "OTRO"
		}
	}

	return dto, nil
}

// EnrollExistingStudent matricula un estudiante antiguo (Caso B)
func (s *StudentService) EnrollExistingStudent(data EnrollmentDTO) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		// 1. Buscar y Actualizar Estudiante
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

		// 2. Crear NUEVO Historial Académico
		historial := student.HistorialAcademico{
			EstudianteID:           estudiante.ID,
			AulaID:                 data.AulaID,
			DireccionDomicilio:     data.Direccion,
			TelefonoContacto:       data.Telefono,
			EsNuevo:                false, // Es antiguo
			InstitucionProcedencia: data.InstitucionProcedencia,
			HaRepetido:             data.EsRepetidor,
			Peso:                   data.Peso,
			Talla:                  data.Talla,
		}

		if err := tx.Create(&historial).Error; err != nil {
			return fmt.Errorf("error al crear historial: %v", err)
		}

		// 3. Actualizar o Crear Familiares
		updateOrCreateFamiliar := func(rol string, famData FamiliarDTO) error {
			if famData.Nombres == "" {
				return nil
			}

			var fam student.Familiar
			err := tx.Where("estudiante_id = ? AND rol = ?", estudiante.ID, rol).First(&fam).Error

			if err == nil {
				// Actualizar existente
				fam.Cedula = famData.Cedula
				fam.NombresCompletos = strings.ToUpper(famData.Nombres)
				fam.Telefono = famData.Telefono
				fam.Profesion = famData.Profesion
				fam.LugarTrabajo = famData.LugarTrabajo
				fam.NivelInstruccion = famData.NivelInstruccion
				return tx.Save(&fam).Error
			} else if errors.Is(err, gorm.ErrRecordNotFound) {
				// Crear nuevo
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

		// Manejo de Representante Legal
		// Resetear flags anteriores
		if err := tx.Model(&student.Familiar{}).Where("estudiante_id = ?", estudiante.ID).Update("es_representante_legal", false).Error; err != nil {
			return err
		}

		if data.RepresentanteRol == "PADRE" {
			if err := tx.Model(&student.Familiar{}).Where("estudiante_id = ? AND rol = 'PADRE'", estudiante.ID).Update("es_representante_legal", true).Error; err != nil {
				return errors.New("error asignando representante padre")
			}
		} else if data.RepresentanteRol == "MADRE" {
			if err := tx.Model(&student.Familiar{}).Where("estudiante_id = ? AND rol = 'MADRE'", estudiante.ID).Update("es_representante_legal", true).Error; err != nil {
				return errors.New("error asignando representante madre")
			}
		} else {
			// Rol OTRO (REPRESENTANTE)
			// Buscar si ya existe un rol REPRESENTANTE y actualizarlo, o crear uno nuevo
			if err := updateOrCreateFamiliar("REPRESENTANTE", data.Representante); err != nil {
				return err
			}
			// Setear flag
			if err := tx.Model(&student.Familiar{}).Where("estudiante_id = ? AND rol = 'REPRESENTANTE'", estudiante.ID).Update("es_representante_legal", true).Error; err != nil {
				return err
			}
		}

		// 4. Crear NUEVA Ficha de Salud (vinculada al nuevo historial)
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

// DTOs para Perfil
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

// GetStudentProfile obtiene el perfil completo del estudiante
// Si anioLectivoID es 0, busca el historial del año activo o el más reciente
func (s *StudentService) GetStudentProfile(estudianteID uint, anioLectivoID uint) (*StudentProfileDTO, error) {
	var profile StudentProfileDTO

	// 1. Obtener Estudiante
	if err := s.db.First(&profile.Estudiante, estudianteID).Error; err != nil {
		return nil, fmt.Errorf("estudiante no encontrado")
	}

	// 2. Obtener Familiares (Globales)
	s.db.Where("estudiante_id = ?", estudianteID).Find(&profile.Familiares)

	// 3. Obtener Años Disponibles (Historiales previos)
	// Hacemos un join con Aula y AnioLectivo para obtener los nombres de los años
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

	// Fallback: Si no hay años disponibles (estudiante nuevo sin historial o error), cargar año activo
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

	// 4. Determinar qué historial cargar
	var historial student.HistorialAcademico
	query := s.db.Preload("Aula").
		Preload("Aula.Curso").
		Preload("Aula.Paralelo").
		Preload("Aula.AnioLectivo").
		Preload("Aula.TutorDocente").
		Where("estudiante_id = ?", estudianteID)

	if anioLectivoID != 0 {
		// Buscar historial específico por año
		// Necesitamos hacer join para filtrar por año del aula
		query = query.Joins("JOIN aulas ON historial_academicos.aula_id = aulas.id").
			Where("aulas.anio_lectivo_id = ?", anioLectivoID)
	} else {
		// Buscar el más reciente (ordenado por ID desc, asumiendo ID incremental)
		query = query.Order("id desc")
	}

	err := query.First(&historial).Error
	if err == nil {
		profile.HistorialActual = &historial

		// 5. Cargar Salud vinculada a este historial
		var salud welfare.SaludVulnerabilidad
		if err := s.db.Where("historial_id = ?", historial.ID).First(&salud).Error; err == nil {
			profile.Salud = &salud
		}
	}

	return &profile, nil
}

// ==========================================
// GESTIÓN ADMINISTRATIVA
// ==========================================

type AulaOptionDTO struct {
	ID       uint   `json:"id"`
	Paralelo string `json:"paralelo"`
}

// GetAlternativeAulas obtiene otros paralelos disponibles para el mismo curso y año
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

// ChangeStudentParallel mueve al estudiante a otro paralelo (actualiza el aula en el historial)
func (s *StudentService) ChangeStudentParallel(historialID uint, targetAulaID uint) error {
	return s.db.Model(&student.HistorialAcademico{}).
		Where("id = ?", historialID).
		Update("aula_id", targetAulaID).Error
}

// WithdrawStudent marca al estudiante como retirado
func (s *StudentService) WithdrawStudent(historialID uint, motivo string, fecha time.Time) error {
	return s.db.Model(&student.HistorialAcademico{}).
		Where("id = ?", historialID).
		Updates(map[string]interface{}{
			"estado":        "RETIRADO",
			"motivo_retiro": motivo,
			"fecha_retiro":  fecha,
		}).Error
}

// UpdateStudentPhoto actualiza la foto de perfil
func (s *StudentService) UpdateStudentPhoto(estudianteID uint, photoBase64 string) error {
	// Decodificar base64
	parts := strings.Split(photoBase64, ",")
	if len(parts) != 2 {
		return fmt.Errorf("formato de imagen inválido")
	}

	data, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return fmt.Errorf("error al decodificar imagen: %v", err)
	}

	// Crear directorio si no existe
	uploadDir := "uploads/photos"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return fmt.Errorf("error al crear directorio: %v", err)
	}

	// Guardar archivo
	filename := fmt.Sprintf("student_%d_%d.jpg", estudianteID, time.Now().Unix())
	filePath := filepath.Join(uploadDir, filename)

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return fmt.Errorf("error al guardar archivo: %v", err)
	}

	// Guardar path absoluto
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

// GetWithdrawnStudents obtiene el listado de estudiantes retirados
func (s *StudentService) GetWithdrawnStudents(anioID uint, queryStr string, page int, pageSize int) (*WithdrawnStudentListResponse, error) {
	var students []WithdrawnStudentDTO
	var total int64
	offset := (page - 1) * pageSize

	// Base query
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

	// Filtro por año lectivo
	if anioID != 0 {
		dbQuery = dbQuery.Where("aulas.anio_lectivo_id = ?", anioID)
	}

	// Búsqueda por texto
	if queryStr != "" {
		term := "%" + queryStr + "%"
		dbQuery = dbQuery.Where("(estudiantes.cedula LIKE ? OR estudiantes.apellidos LIKE ? OR estudiantes.nombres LIKE ?)", term, term, term)
	}

	// Contar total
	if err := dbQuery.Count(&total).Error; err != nil {
		return nil, err
	}

	// Obtener datos paginados
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
