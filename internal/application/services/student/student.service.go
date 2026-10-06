package services

import (
	"context"
	studentDTO "dece/internal/application/dtos/student"
	"dece/internal/application/helpers/busqueda"
	"dece/internal/application/helpers/periodo"
	"dece/internal/domain/common"
	"dece/internal/domain/enrollment"
	"dece/internal/domain/faculty"
	"dece/internal/domain/student"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"mime"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

type StudentService struct {
	ctx context.Context
	db  *gorm.DB
}

func NewStudentService(db *gorm.DB) *StudentService {
	return &StudentService{db: db}
}

func (s *StudentService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

// ImportRowError representa un error en una fila específica del Excel
type ImportRowError struct {
	Fila    int    `json:"fila"`
	Cedula  string `json:"cedula"`
	Detalle string `json:"detalle"`
}

// ImportResult contiene el resultado detallado de la importación
type ImportResult struct {
	TotalFilas   int              `json:"totalFilas"`
	Creados      int              `json:"creados"`
	Actualizados int              `json:"actualizados"`
	Omitidos     int              `json:"omitidos"`
	Errores      []ImportRowError `json:"errores"`
}

// separarNombresCompletos separa "APELLIDO1 APELLIDO2 NOMBRE1 NOMBRE2" en (apellidos, nombres).
// Aplica la convención ecuatoriana: si hay 4+ palabras → 2 primeras son apellidos, resto nombres.
// Si hay 3 palabras → 1ra apellido, 2da y 3ra nombres (caso de apellido simple).
// Si hay 2 → 1ra apellido, 2da nombre.
// Si hay 1 → todo va a apellidos.
func separarNombresCompletos(nombresCompletos string) (apellidos, nombres string) {
	cleaned := strings.TrimSpace(nombresCompletos)
	if cleaned == "" {
		return "", ""
	}

	parts := strings.Fields(cleaned) // divide por cualquier espacio

	switch len(parts) {
	case 1:
		return strings.ToUpper(parts[0]), ""
	case 2:
		return strings.ToUpper(parts[0]), strings.ToUpper(parts[1])
	case 3:
		// Convención: 1 apellido + 2 nombres
		return strings.ToUpper(parts[0]), strings.ToUpper(strings.Join(parts[1:], " "))
	default:
		// 4+ palabras: 2 apellidos + resto nombres
		return strings.ToUpper(strings.Join(parts[:2], " ")), strings.ToUpper(strings.Join(parts[2:], " "))
	}
}

func (s *StudentService) ImportarEstudiantes(cursoID uint) (*ImportResult, error) {
	if s.ctx == nil {
		return nil, errors.New("contexto no inicializado")
	}

	filePath, err := runtime.OpenFileDialog(s.ctx, runtime.OpenDialogOptions{
		Title: "Seleccionar Archivo Excel",
		Filters: []runtime.FileFilter{
			{DisplayName: "Archivos Excel", Pattern: "*.xlsx;*.xlsm"},
		},
	})
	if err != nil {
		return nil, err
	}
	if filePath == "" {
		return nil, nil // Usuario canceló
	}

	return s.importarArchivo(filePath, cursoID)
}

// emitirProgresoImportacion avisa al frontend; sin contexto de Wails (pruebas) no hace nada.
func (s *StudentService) emitirProgresoImportacion(datos map[string]int) {
	if s.ctx != nil {
		runtime.EventsEmit(s.ctx, "student:import_progress", datos)
	}
}

// importarArchivo procesa el Excel ya elegido; separado del diálogo para poder probarlo.
func (s *StudentService) importarArchivo(filePath string, cursoID uint) (*ImportResult, error) {
	f, err := excelize.OpenFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("error al abrir el archivo Excel: %v", err)
	}
	defer f.Close()

	sheetName := f.GetSheetName(0)
	rows, err := f.GetRows(sheetName)
	if err != nil {
		return nil, fmt.Errorf("error al leer las filas del Excel: %v", err)
	}

	// === DETECCIÓN FLEXIBLE DE COLUMNAS ===
	idxCedula, idxNombresCompletos, idxNombres, idxApellidos, idxCorreo, idxGenero := -1, -1, -1, -1, -1, -1
	headerRowIndex := -1

	for i, row := range rows {
		foundCedula := false
		for j, cell := range row {
			val := strings.ToLower(strings.TrimSpace(cell))
			// Quitar tildes para comparación
			valNorm := strings.NewReplacer("á", "a", "é", "e", "í", "i", "ó", "o", "ú", "u").Replace(val)

			switch {
			case strings.Contains(valNorm, "cedula"):
				idxCedula = j
				foundCedula = true
			case valNorm == "nombres completos" || valNorm == "nombre completo" || valNorm == "nombres y apellidos" || valNorm == "apellidos y nombres":
				idxNombresCompletos = j
			case valNorm == "nombres" || valNorm == "nombre":
				idxNombres = j
			case valNorm == "apellidos" || valNorm == "apellido":
				idxApellidos = j
			case strings.Contains(valNorm, "correo") || valNorm == "email" || valNorm == "cuenta" || valNorm == "e-mail" || valNorm == "mail":
				idxCorreo = j
			case valNorm == "genero" || valNorm == "sexo":
				idxGenero = j
			}
		}

		// Validamos que al menos tengamos cédula y algún campo de nombre
		tieneNombreSeparado := idxNombres >= 0 && idxApellidos >= 0
		tieneNombreUnido := idxNombresCompletos >= 0

		if foundCedula && (tieneNombreSeparado || tieneNombreUnido) {
			headerRowIndex = i
			break
		}
	}

	if headerRowIndex == -1 {
		colsRequeridas := "CÉDULA + (NOMBRES COMPLETOS | NOMBRES + APELLIDOS)"
		return nil, fmt.Errorf("no se encontraron las columnas requeridas: %s. Verifique los encabezados del Excel", colsRequeridas)
	}

	modoUnido := idxNombresCompletos >= 0 && (idxNombres < 0 || idxApellidos < 0)

	// === PROCESAMIENTO DE FILAS ===
	totalFilas := len(rows) - (headerRowIndex + 1)
	result := &ImportResult{
		TotalFilas: totalFilas,
		Errores:    make([]ImportRowError, 0),
	}

	// Periodo del curso destino, para no matricular dos veces en el mismo periodo.
	var periodoCursoID uint
	if cursoID > 0 {
		var curso faculty.Curso
		if err := s.db.Select("id", "periodo_id").First(&curso, cursoID).Error; err != nil {
			return nil, errors.New("El curso seleccionado no existe")
		}
		periodoCursoID = curso.PeriodoID
	}

	processedCount := 0

	for i := headerRowIndex + 1; i < len(rows); i++ {
		processedCount++
		filaExcel := i + 1 // Número de fila visible en Excel (1-indexed)

		// Emitir progreso cada 5 filas o en la última
		if processedCount%5 == 0 || processedCount == totalFilas {
			s.emitirProgresoImportacion(map[string]int{
				"current":      processedCount,
				"total":        totalFilas,
				"creados":      result.Creados,
				"actualizados": result.Actualizados,
				"errores":      len(result.Errores),
			})
		}

		row := rows[i]
		getVal := func(idx int) string {
			if idx >= 0 && idx < len(row) {
				return strings.TrimSpace(row[idx])
			}
			return ""
		}

		cedula := normalizarCedula(getVal(idxCedula))
		correo := getVal(idxCorreo)
		genero := normalizarGenero(getVal(idxGenero))

		// --- Validación: Cédula vacía → omitir (fila vacía) ---
		if cedula == "" {
			result.Omitidos++
			continue
		}
		if !cedulaEcuatorianaValida(cedula) {
			result.Errores = append(result.Errores, ImportRowError{
				Fila:    filaExcel,
				Cedula:  cedula,
				Detalle: "Cédula inválida (debe tener 10 dígitos y un dígito verificador correcto)",
			})
			continue
		}

		// --- Resolver apellidos y nombres ---
		var apellidos, nombres string
		if modoUnido {
			nombresCompletos := getVal(idxNombresCompletos)
			if nombresCompletos == "" {
				result.Errores = append(result.Errores, ImportRowError{
					Fila:    filaExcel,
					Cedula:  cedula,
					Detalle: "El campo 'Nombres Completos' está vacío",
				})
				continue
			}
			apellidos, nombres = separarNombresCompletos(nombresCompletos)
		} else {
			apellidos = strings.ToUpper(strings.TrimSpace(getVal(idxApellidos)))
			nombres = strings.ToUpper(strings.TrimSpace(getVal(idxNombres)))
		}

		if apellidos == "" && nombres == "" {
			result.Errores = append(result.Errores, ImportRowError{
				Fila:    filaExcel,
				Cedula:  cedula,
				Detalle: "No se pudo obtener nombres ni apellidos",
			})
			continue
		}

		// --- UPSERT: Buscar por cédula y crear o actualizar ---
		var estudianteID uint
		var existente student.Estudiante
		dbErr := s.db.Where("cedula = ?", cedula).First(&existente).Error

		if dbErr == nil {
			// Ya existe -> Actualizar
			estudianteID = existente.ID
			updates := map[string]interface{}{}
			if apellidos != "" {
				updates["apellidos"] = apellidos
			}
			if nombres != "" {
				updates["nombres"] = nombres
			}
			if correo != "" {
				updates["correo_electronico"] = correo
			}
			if genero != "" {
				updates["genero_nacimiento"] = genero
			}

			if len(updates) > 0 {
				if err := s.db.Model(&existente).Updates(updates).Error; err != nil {
					result.Errores = append(result.Errores, ImportRowError{
						Fila:    filaExcel,
						Cedula:  cedula,
						Detalle: fmt.Sprintf("Error al actualizar: %v", err),
					})
					continue
				}
			}
			result.Actualizados++

		} else if errors.Is(dbErr, gorm.ErrRecordNotFound) {
			// No existe -> Crear
			nuevo := student.Estudiante{
				Cedula:            cedula,
				Apellidos:         apellidos,
				Nombres:           nombres,
				CorreoElectronico: correo,
				InfoNacionalidad:  common.JSONMap[student.InfoNacionalidad]{Data: student.InfoNacionalidad{EsExtranjero: false}},
				GeneroNacimiento:  genero, // vacío si el Excel no trae la columna; se completa en la ficha
				FechaCreacion:     time.Now().Format("2006-01-02 15:04:05"),
			}
			if err := s.db.Create(&nuevo).Error; err != nil {
				result.Errores = append(result.Errores, ImportRowError{
					Fila:    filaExcel,
					Cedula:  cedula,
					Detalle: fmt.Sprintf("Error al crear: %v", err),
				})
				continue
			}
			estudianteID = nuevo.ID
			result.Creados++

		} else {
			// Error inesperado
			result.Errores = append(result.Errores, ImportRowError{
				Fila:    filaExcel,
				Cedula:  cedula,
				Detalle: fmt.Sprintf("Error de consulta: %v", dbErr),
			})
			continue
		}

		// --- MATRICULACIÓN AUTOMÁTICA (Si se seleccionó curso) ---
		if cursoID > 0 && estudianteID > 0 {
			var matriculaExistente enrollment.Matricula
			// Verificar si ya tiene matrícula vigente en cualquier curso del mismo periodo
			errMat := s.db.Joins("JOIN cursos ON cursos.id = matriculas.curso_id").
				Where("matriculas.estudiante_id = ? AND matriculas.estado = ? AND cursos.periodo_id = ?", estudianteID, "Matriculado", periodoCursoID).
				First(&matriculaExistente).Error

			if errMat == nil && matriculaExistente.CursoID != cursoID {
				result.Errores = append(result.Errores, ImportRowError{
					Fila:    filaExcel,
					Cedula:  cedula,
					Detalle: "Estudiante procesado, pero no se matriculó: ya está matriculado en otro curso de este periodo",
				})
			} else if errors.Is(errMat, gorm.ErrRecordNotFound) {
				// Crear matrícula
				nuevaMatricula := enrollment.Matricula{
					EstudianteID:  estudianteID,
					CursoID:       cursoID,
					Estado:        "Matriculado",
					FechaRegistro: time.Now().Format("2006-01-02 15:04:05"),
				}
				if err := s.db.Create(&nuevaMatricula).Error; err != nil {
					// No bloqueamos el proceso, pero registramos el error como warning o error de fila
					// Podríamos agregarlo a errores, aunque el estudiante se creó bien.
					// Decisión: Agregarlo como error con detalle "Estudiante OK pero falló matriculación"
					result.Errores = append(result.Errores, ImportRowError{
						Fila:    filaExcel,
						Cedula:  cedula,
						Detalle: fmt.Sprintf("Estudiante procesado pero error al matricular: %v", err),
					})
				}
			}
		}
	}

	// Emitir progreso final
	s.emitirProgresoImportacion(map[string]int{
		"current":      totalFilas,
		"total":        totalFilas,
		"creados":      result.Creados,
		"actualizados": result.Actualizados,
		"errores":      len(result.Errores),
	})

	return result, nil
}

// normalizarGenero convierte los valores habituales del Excel a "M"/"F"; vacío si no se reconoce.
func normalizarGenero(valor string) string {
	switch strings.ToLower(strings.TrimSpace(valor)) {
	case "m", "masculino", "hombre", "h":
		return "M"
	case "f", "femenino", "mujer":
		return "F"
	}
	return ""
}

func CaclularEdad(fechaNacimiento string) int {
	if fechaNacimiento == "" {
		return 0
	}

	nacimiento, err := time.Parse("2006-01-02", fechaNacimiento)
	if err != nil {
		return 0
	}

	hoy := time.Now()
	edad := hoy.Year() - nacimiento.Year()

	if hoy.Month() < nacimiento.Month() ||
		(hoy.Month() == nacimiento.Month() && hoy.Day() < nacimiento.Day()) {
		edad--
	}

	return edad
}

// periodoConsultaID devuelve el periodo que se está viendo (el de consulta o el activo).
func (s *StudentService) periodoConsultaID() (uint, error) {
	return periodo.ConsultaID(s.db)
}

func filtrarYMapearEstudiantes(estudiantes []student.Estudiante, query string) []studentDTO.EstudianteListaDTO {
	palabras := busqueda.Palabras(query)

	response := make([]studentDTO.EstudianteListaDTO, 0, len(estudiantes))
	for _, e := range estudiantes {
		if !busqueda.Coincide(palabras, e.Cedula, e.Apellidos, e.Nombres, e.InfoNacionalidad.Data.PasaporteOrDNI) {
			continue
		}
		response = append(response, studentDTO.EstudianteListaDTO{
			ID:                    e.ID,
			Cedula:                e.Cedula,
			Apellidos:             e.Apellidos,
			Nombres:               e.Nombres,
			CorreoElectronico:     e.CorreoElectronico,
			RutaFoto:              e.RutaFoto,
			RutaCedula:            e.RutaCedula,
			RutaPartidaNacimiento: e.RutaPartidaNacimiento,
			FechaNacimiento:       e.FechaNacimiento,
			Edad:                  CaclularEdad(e.FechaNacimiento),
			InfoNacionalidad: &studentDTO.InfoNacionalidadDTO{
				EsExtranjero:   e.InfoNacionalidad.Data.EsExtranjero,
				PaisOrigen:     e.InfoNacionalidad.Data.PaisOrigen,
				PasaporteOrDNI: e.InfoNacionalidad.Data.PasaporteOrDNI,
			},
		})
	}
	return response
}

// matriculaActivaSQL comprueba que el estudiante tenga una matrícula vigente en el periodo activo.
const matriculaActivaSQL = `EXISTS (
	SELECT 1 FROM matriculas
	JOIN cursos ON cursos.id = matriculas.curso_id
	WHERE matriculas.estudiante_id = estudiantes.id
	  AND matriculas.estado = 'Matriculado'
	  AND cursos.periodo_id = ?`

func (s *StudentService) BuscarEstudiantes(query string) ([]studentDTO.EstudianteListaDTO, error) {
	return s.BuscarEstudiantesFiltrados(query, 0, "", "", false)
}

// BuscarEstudiantesFiltrados lista estudiantes matriculados en el periodo activo, filtrando
// por nivel, paralelo y jornada (cada filtro es opcional). Con sinMatricula=true lista, en
// cambio, los estudiantes sin matrícula vigente en el periodo activo (y se ignoran los filtros de curso).
// La búsqueda de texto ignora mayúsculas y tildes y se hace en Go: SQLite LIKE no lo soporta.
func (s *StudentService) BuscarEstudiantesFiltrados(query string, nivelID uint, paralelo string, jornada string, sinMatricula bool) ([]studentDTO.EstudianteListaDTO, error) {
	periodoID, err := s.periodoConsultaID()
	if err != nil {
		return nil, err
	}

	dbQuery := s.db.Model(&student.Estudiante{})

	if sinMatricula {
		if periodoID > 0 {
			dbQuery = dbQuery.Where("NOT "+matriculaActivaSQL+")", periodoID)
		}
	} else {
		if periodoID == 0 {
			// Sin periodo activo no hay matriculados: lista vacía sin error.
			return []studentDTO.EstudianteListaDTO{}, nil
		}
		filtroCurso := matriculaActivaSQL
		args := []any{periodoID}
		if nivelID > 0 {
			filtroCurso += " AND cursos.nivel_id = ?"
			args = append(args, nivelID)
		}
		if paralelo != "" {
			filtroCurso += " AND cursos.paralelo = ?"
			args = append(args, paralelo)
		}
		if jornada != "" {
			filtroCurso += " AND cursos.jornada = ?"
			args = append(args, jornada)
		}
		dbQuery = dbQuery.Where(filtroCurso+")", args...)
	}

	var estudiantes []student.Estudiante
	if err := dbQuery.Order("estudiantes.apellidos ASC, estudiantes.nombres ASC").Find(&estudiantes).Error; err != nil {
		return nil, err
	}

	return filtrarYMapearEstudiantes(estudiantes, query), nil
}

// BuscarEstudiantesFicha busca entre todos los estudiantes (matriculados o no) e indica
// su curso y estado de matrícula en el periodo activo. La usa la Ficha DECE para poder
// matricular estudiantes nuevos o reingresar retirados.
func (s *StudentService) BuscarEstudiantesFicha(query string) ([]studentDTO.EstudianteListaDTO, error) {
	var estudiantes []student.Estudiante
	if err := s.db.Order("apellidos ASC, nombres ASC").Find(&estudiantes).Error; err != nil {
		return nil, err
	}
	resultados := filtrarYMapearEstudiantes(estudiantes, query)
	if len(resultados) > 50 {
		resultados = resultados[:50]
	}

	periodoID, err := s.periodoConsultaID()
	if err != nil || periodoID == 0 || len(resultados) == 0 {
		return resultados, err
	}

	ids := make([]uint, len(resultados))
	for i, r := range resultados {
		ids[i] = r.ID
	}
	var matriculas []struct {
		EstudianteID uint
		Estado       string
		Curso        string
	}
	// Ordenadas por id: si hay reingreso, la última matrícula sobrescribe a la retirada.
	err = s.db.Table("matriculas").
		Select("matriculas.estudiante_id, matriculas.estado, nivel_educativos.nombre || ' ' || cursos.paralelo AS curso").
		Joins("JOIN cursos ON cursos.id = matriculas.curso_id").
		Joins("JOIN nivel_educativos ON nivel_educativos.id = cursos.nivel_id").
		Where("cursos.periodo_id = ? AND matriculas.estudiante_id IN ?", periodoID, ids).
		Order("matriculas.id ASC").
		Scan(&matriculas).Error
	if err != nil {
		return nil, err
	}
	porEstudiante := map[uint]int{}
	for i, r := range resultados {
		porEstudiante[r.ID] = i
	}
	for _, m := range matriculas {
		r := &resultados[porEstudiante[m.EstudianteID]]
		r.Curso = m.Curso
		r.EstadoMatricula = m.Estado
	}
	return resultados, nil
}

func (s *StudentService) ObtenerEstudiante(id uint) (*student.Estudiante, error) {
	var est student.Estudiante
	err := s.db.Preload("Familiares").First(&est, id).Error
	if err != nil {
		return nil, errors.New("Estudiante no encontrado")
	}
	return &est, nil
}

// cedulaEcuatorianaValida verifica formato, código de provincia y dígito verificador (módulo 10).
func cedulaEcuatorianaValida(cedula string) bool {
	if len(cedula) != 10 {
		return false
	}
	d := make([]int, 10)
	for i, c := range cedula {
		if c < '0' || c > '9' {
			return false
		}
		d[i] = int(c - '0')
	}
	provincia := d[0]*10 + d[1]
	if (provincia < 1 || provincia > 24) && provincia != 30 {
		return false
	}
	if d[2] > 5 {
		return false
	}
	suma := 0
	for i := 0; i < 9; i++ {
		v := d[i]
		if i%2 == 0 {
			v *= 2
			if v > 9 {
				v -= 9
			}
		}
		suma += v
	}
	return (10-suma%10)%10 == d[9]
}

// normalizarCedula limpia la cédula y recupera el 0 inicial que Excel elimina
// cuando la celda es numérica (provincias 01-09: "812345678" -> "0812345678").
func normalizarCedula(cedula string) string {
	cedula = strings.TrimSpace(cedula)
	if len(cedula) == 9 && strings.Trim(cedula, "0123456789") == "" {
		return "0" + cedula
	}
	return cedula
}

func (s *StudentService) GuardarEstudiante(input studentDTO.GuardarEstudianteDTO) (*student.Estudiante, error) {
	input.Apellidos = strings.TrimSpace(input.Apellidos)
	input.Nombres = strings.TrimSpace(input.Nombres)
	input.PasaporteOrDNI = strings.ToUpper(strings.TrimSpace(input.PasaporteOrDNI))
	input.Cedula = strings.TrimSpace(input.Cedula)

	if input.Apellidos == "" || input.Nombres == "" {
		return nil, errors.New("Nombres y apellidos son obligatorios")
	}
	if input.EsExtranjero {
		// Los extranjeros sin cédula se identifican por su pasaporte o DNI.
		if input.PasaporteOrDNI == "" {
			return nil, errors.New("El pasaporte o DNI es obligatorio para estudiantes extranjeros")
		}
		input.Cedula = input.PasaporteOrDNI
	} else if !cedulaEcuatorianaValida(input.Cedula) {
		return nil, fmt.Errorf("La cédula %s no es válida", input.Cedula)
	}

	var estGuardado *student.Estudiante

	err := s.db.Transaction(func(tx *gorm.DB) error {

		var count int64
		query := tx.Model(&student.Estudiante{}).Where("cedula = ?", input.Cedula)
		if input.ID > 0 {
			query = query.Where("id <> ?", input.ID)
		}
		if err := query.Count(&count).Error; err != nil {
			return fmt.Errorf("Error al verificar la cédula: %v", err)
		}

		if count > 0 {
			return fmt.Errorf("La identificación %s ya pertenece a otro estudiante", input.Cedula)
		}

		est := student.Estudiante{
			ID:                input.ID,
			Cedula:            input.Cedula,
			Apellidos:         strings.ToUpper(input.Apellidos),
			Nombres:           strings.ToUpper(input.Nombres),
			FechaNacimiento:   input.FechaNacimiento,
			GeneroNacimiento:  input.GeneroNacimiento,
			CorreoElectronico: strings.TrimSpace(input.CorreoElectronico),

			RutaFoto: input.RutaFoto,

			RutaCedula:            input.RutaCedula,
			RutaPartidaNacimiento: input.RutaPartidaNacimiento,
		}

		est.InfoNacionalidad = common.JSONMap[student.InfoNacionalidad]{
			Data: student.InfoNacionalidad{
				EsExtranjero:   input.EsExtranjero,
				PaisOrigen:     input.PaisOrigen,
				PasaporteOrDNI: input.PasaporteOrDNI,
			},
		}

		// Los familiares se sincronizan aparte: Save no actualiza ni borra asociaciones existentes.
		if est.ID == 0 {
			est.FechaCreacion = time.Now().Format("2006-01-02 15:04:05")
			if err := tx.Omit("Familiares").Create(&est).Error; err != nil {
				return fmt.Errorf("Error al guardar ficha completa: %v", err)
			}
		} else {
			res := tx.Model(&est).Select("*").Omit("ID", "FechaCreacion", "Familiares").Updates(&est)
			if res.Error != nil {
				return fmt.Errorf("Error al guardar ficha completa: %v", res.Error)
			}
			if res.RowsAffected == 0 {
				return errors.New("Estudiante no encontrado")
			}
		}

		if err := sincronizarFamiliares(tx, est.ID, input.Familiares); err != nil {
			return err
		}

		if err := tx.Preload("Familiares").First(&est, est.ID).Error; err != nil {
			return err
		}
		estGuardado = &est
		return nil
	})

	if err != nil {
		return nil, err
	}

	return estGuardado, nil
}

// sincronizarFamiliares deja en la BD exactamente los familiares recibidos:
// crea los nuevos (ID 0), actualiza los existentes y elimina los que ya no vienen.
func sincronizarFamiliares(tx *gorm.DB, estudianteID uint, familiares []studentDTO.GuardarFamiliarDTO) error {
	conservar := []uint{}
	for _, f := range familiares {
		if f.ID > 0 {
			conservar = append(conservar, f.ID)
		}
	}

	borrar := tx.Where("estudiante_id = ?", estudianteID)
	if len(conservar) > 0 {
		borrar = borrar.Where("id NOT IN ?", conservar)
	}
	if err := borrar.Delete(&student.Familiar{}).Error; err != nil {
		return fmt.Errorf("Error al eliminar familiares: %v", err)
	}

	for _, f := range familiares {
		fam := student.Familiar{
			ID:                   f.ID,
			EstudianteID:         estudianteID,
			Cedula:               strings.TrimSpace(f.Cedula),
			NombresCompletos:     strings.ToUpper(strings.TrimSpace(f.NombresCompletos)),
			Parentesco:           f.Parentesco,
			EsRepresentanteLegal: f.EsRepresentanteLegal,
			ViveConEstudiante:    f.ViveConEstudiante,
			TelefonoPersonal:     strings.TrimSpace(f.TelefonoPersonal),
			Fallecido:            f.Fallecido,

			DatosExtendidos: common.JSONMap[student.DatosFamiliar]{
				Data: student.DatosFamiliar{
					NivelInstruccion: f.DatosExtendidos.NivelInstruccion,
					Profesion:        f.DatosExtendidos.Profesion,
					LugarTrabajo:     f.DatosExtendidos.LugarTrabajo,
				},
			},
		}

		if fam.ID == 0 {
			if err := tx.Create(&fam).Error; err != nil {
				return fmt.Errorf("Error al guardar familiar %s: %v", fam.NombresCompletos, err)
			}
			continue
		}

		// El filtro por estudiante evita modificar un familiar de otro estudiante.
		res := tx.Model(&fam).Where("estudiante_id = ?", estudianteID).Select("*").Omit("ID").Updates(&fam)
		if res.Error != nil {
			return fmt.Errorf("Error al guardar familiar %s: %v", fam.NombresCompletos, res.Error)
		}
		if res.RowsAffected == 0 {
			return fmt.Errorf("El familiar %s no pertenece a este estudiante", fam.NombresCompletos)
		}
	}
	return nil
}

func (s *StudentService) GuardarFoto(id uint, rutaOrigen string) (string, error) {
	var est student.Estudiante

	if err := s.db.First(&est, id).Error; err != nil {
		return "", errors.New("Estudiante no encontrado")
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", errors.New("No se pudo acceder a la carpeta del usuario")
	}

	destinoDir := filepath.Join(homeDir, "Documents", "SistemaDECE", "FotosEstudiantes")

	if err := os.MkdirAll(destinoDir, 0755); err != nil {
		return "", fmt.Errorf("Error al crear carpeta de fotos: %v", err)
	}

	ext := filepath.Ext(rutaOrigen)
	if ext == "" {
		ext = ".jpg"
	}

	nuevoNombre := fmt.Sprintf("%s_%d%s", est.Cedula, time.Now().Unix(), ext)
	rutaDestinoCompleta := filepath.Join(destinoDir, nuevoNombre)

	srcFile, err := os.Open(rutaOrigen)
	if err != nil {
		return "", fmt.Errorf("Error al leer imagen original: %v", err)
	}
	defer srcFile.Close()

	dstFile, err := os.Create(rutaDestinoCompleta)
	if err != nil {
		return "", fmt.Errorf("Error al crear imagen destino: %v", err)
	}
	defer dstFile.Close()

	if _, err := io.Copy(dstFile, srcFile); err != nil {
		return "", fmt.Errorf("Error al copiar imagen: %v", err)
	}

	if est.RutaFoto != "" {
		if _, err := os.Stat(est.RutaFoto); err == nil {
			os.Remove(est.RutaFoto)
		}
	}

	if err := s.db.Model(&est).Update("ruta_foto", rutaDestinoCompleta).Error; err != nil {
		return "", fmt.Errorf("Imagen copiada pero error al actualizar BD: %v", err)
	}

	return rutaDestinoCompleta, nil
}

func (s *StudentService) GuardarFotoBase64(id uint, dataURL string, filename string) (string, error) {
	var est student.Estudiante

	if err := s.db.First(&est, id).Error; err != nil {
		return "", errors.New("Estudiante no encontrado")
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", errors.New("No se pudo acceder a la carpeta del usuario")
	}

	destinoDir := filepath.Join(homeDir, "Documents", "SistemaDECE", "FotosEstudiantes")

	if err := os.MkdirAll(destinoDir, 0755); err != nil {
		return "", fmt.Errorf("Error al crear carpeta de fotos: %v", err)
	}

	ext := filepath.Ext(filename)
	if ext == "" {
		if strings.HasPrefix(dataURL, "data:") {
			parts := strings.SplitN(dataURL, ";", 2)
			if len(parts) > 0 {
				mime := strings.TrimPrefix(parts[0], "data:")
				switch mime {
				case "image/png":
					ext = ".png"
				case "image/jpeg":
					ext = ".jpg"
				case "image/jpg":
					ext = ".jpg"
				case "image/gif":
					ext = ".gif"
				default:
					ext = ".jpg"
				}
			}
		} else {
			ext = ".jpg"
		}
	}

	payload := dataURL
	if _, after, ok := strings.Cut(dataURL, "base64,"); ok {
		payload = after
	}

	decoded, err := base64.StdEncoding.DecodeString(payload)
	if err != nil {
		return "", fmt.Errorf("Error al decodificar base64: %v", err)
	}

	nuevoNombre := fmt.Sprintf("%s_%d%s", est.Cedula, time.Now().Unix(), ext)
	rutaDestinoCompleta := filepath.Join(destinoDir, nuevoNombre)

	if err := os.WriteFile(rutaDestinoCompleta, decoded, 0644); err != nil {
		return "", fmt.Errorf("Error al escribir imagen destino: %v", err)
	}

	if est.RutaFoto != "" {
		if _, err := os.Stat(est.RutaFoto); err == nil {
			os.Remove(est.RutaFoto)
		}
	}

	if err := s.db.Model(&est).Update("ruta_foto", rutaDestinoCompleta).Error; err != nil {
		return "", fmt.Errorf("Imagen guardada pero error al actualizar BD: %v", err)
	}

	return rutaDestinoCompleta, nil
}

func (s *StudentService) ObtenerFotoBase64(id uint) (string, error) {
	var est student.Estudiante

	if err := s.db.First(&est, id).Error; err != nil {
		return "", errors.New("Estudiante no encontrado")
	}

	if est.RutaFoto == "" {
		return "", errors.New("Estudiante no tiene foto")
	}

	data, err := os.ReadFile(est.RutaFoto)
	if err != nil {
		return "", fmt.Errorf("Error leyendo archivo: %v", err)
	}

	ext := strings.ToLower(filepath.Ext(est.RutaFoto))
	mimeType := mime.TypeByExtension(ext)
	if mimeType == "" {
		mimeType = "image/jpeg"
	}

	encoded := base64.StdEncoding.EncodeToString(data)
	dataURL := fmt.Sprintf("data:%s;base64,%s", mimeType, encoded)
	return dataURL, nil
}

func (s *StudentService) GuardarDocumentoPDF(id uint, tipoDocumento string, base64Data string) (string, error) {
	safeTipo := strings.ToLower(tipoDocumento)
	if safeTipo != "cedula" && safeTipo != "partida" {
		return "", errors.New("Tipo de documento inválido")
	}

	var est student.Estudiante

	if err := s.db.First(&est, id).Error; err != nil {
		return "", errors.New("Estudiante no encontrado")
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", errors.New("No se pudo acceder a la carpeta del usuario")
	}

	destinoDir := filepath.Join(homeDir, "Documents", "SistemaDECE", "DocumentosEstudiantes")

	if err := os.MkdirAll(destinoDir, 0755); err != nil {
		return "", fmt.Errorf("Error al crear carpeta de documentos: %v", err)
	}

	payload := base64Data
	if _, after, ok := strings.Cut(base64Data, "base64,"); ok {
		payload = after
	}

	decoded, err := base64.StdEncoding.DecodeString(payload)
	if err != nil {
		return "", fmt.Errorf("Error al decodificar base64: %v", err)
	}

	nuevoNombre := fmt.Sprintf("%s_%s_%d.pdf", est.Cedula, safeTipo, time.Now().Unix())
	rutaDestinoCompleta := filepath.Join(destinoDir, nuevoNombre)

	if err := os.WriteFile(rutaDestinoCompleta, decoded, 0644); err != nil {
		return "", fmt.Errorf("Error al escribir documento destino: %v", err)
	}

	updates := map[string]interface{}{}
	var oldPath string

	if safeTipo == "cedula" {
		updates["ruta_cedula"] = rutaDestinoCompleta
		oldPath = est.RutaCedula
	} else {
		updates["ruta_partida_nacimiento"] = rutaDestinoCompleta
		oldPath = est.RutaPartidaNacimiento
	}

	if oldPath != "" {
		if _, err := os.Stat(oldPath); err == nil {
			os.Remove(oldPath)
		}
	}

	if err := s.db.Model(&est).UpdateColumns(updates).Error; err != nil {
		return "", fmt.Errorf("Documento guardado pero error al actualizar BD: %v", err)
	}

	return rutaDestinoCompleta, nil
}

func (s *StudentService) ObtenerDocumentoPDF(id uint, tipo string) (string, error) {
	var est student.Estudiante
	if err := s.db.First(&est, id).Error; err != nil {
		return "", errors.New("Estudiante no encontrado")
	}

	var path string
	safeTipo := strings.ToLower(tipo)
	if safeTipo == "cedula" {
		path = est.RutaCedula
	} else if safeTipo == "partida" {
		path = est.RutaPartidaNacimiento
	} else {
		return "", errors.New("Tipo de documento inválido")
	}

	if path == "" {
		return "", errors.New("Documento no disponible")
	}

	// Verificar si existe el archivo
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return "", errors.New("El archivo físico no existe")
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("Error leyendo archivo: %v", err)
	}

	encoded := base64.StdEncoding.EncodeToString(data)
	// Retornamos Data URI para que el iframe lo lea directo
	dataURL := fmt.Sprintf("data:application/pdf;base64,%s", encoded)
	return dataURL, nil
}

func (s *StudentService) EliminarFamiliar(id uint) error {
	result := s.db.Delete(&student.Familiar{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("Familiar no encontrado")
	}
	return nil
}

func (s *StudentService) EliminarEstudiante(id uint) error {
	var est student.Estudiante
	if err := s.db.First(&est, id).Error; err != nil {
		return errors.New("Estudiante no encontrado")
	}

	var countMatriculas int64
	if err := s.db.Table("matriculas").Where("estudiante_id = ?", id).Count(&countMatriculas).Error; err != nil {
		return fmt.Errorf("Error al verificar matrículas: %v", err)
	}
	if countMatriculas > 0 {
		return errors.New("No se puede eliminar: el estudiante tiene matrículas registradas.")
	}

	var countCasos int64
	if err := s.db.Table("casos_sensibles").Where("estudiante_id = ?", id).Count(&countCasos).Error; err != nil {
		return fmt.Errorf("Error al verificar casos sensibles: %v", err)
	}
	if countCasos > 0 {
		return errors.New("No se puede eliminar: el estudiante tiene casos sensibles registrados.")
	}

	// Iniciar transacción para eliminar de forma segura
	err := s.db.Transaction(func(tx *gorm.DB) error {
		// Eliminar familiares (por si tiene, aunque esté recién creado)
		if err := tx.Where("estudiante_id = ?", id).Delete(&student.Familiar{}).Error; err != nil {
			return err
		}

		// Eliminar el estudiante
		if err := tx.Delete(&est).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return fmt.Errorf("Error al eliminar el estudiante: %v", err)
	}

	// Los archivos se borran después de confirmar la transacción; si falla, no afecta al registro.
	for _, ruta := range []string{est.RutaFoto, est.RutaCedula, est.RutaPartidaNacimiento} {
		if ruta != "" {
			os.Remove(ruta)
		}
	}

	return nil
}
