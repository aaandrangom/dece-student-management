package services

import (
	"archive/zip"
	"context"
	"dece/internal/domain/common"
	"dece/internal/domain/enrollment"
	"dece/internal/domain/management"
	"dece/internal/domain/security"
	"dece/internal/domain/student"
	"dece/internal/domain/tracking"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"time"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
	"gorm.io/gorm"
)

type TemplateService struct {
	db  *gorm.DB
	ctx context.Context
}

func NewTemplateService(db *gorm.DB) *TemplateService {
	return &TemplateService{db: db}
}

func (s *TemplateService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

// getTemplatesDir devuelve la ruta de la carpeta de plantillas
func (s *TemplateService) getTemplatesDir() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", errors.New("no se pudo obtener carpeta de usuario")
	}
	dir := filepath.Join(homeDir, "Documents", "SistemaDECE", "Plantillas")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("error creando carpeta de plantillas: %v", err)
	}
	return dir, nil
}

// extractTagsFromDocx lee un archivo .docx y extrae las etiquetas {{tag}}
func extractTagsFromDocx(rutaArchivo string) ([]string, error) {
	r, err := zip.OpenReader(rutaArchivo)
	if err != nil {
		return nil, fmt.Errorf("error al abrir archivo docx: %v", err)
	}
	defer r.Close()

	// Patrones
	tagPattern := regexp.MustCompile(`\{\{([^}]+)\}\}`)
	paragraphPattern := regexp.MustCompile(`(?s)<w:p[ >].*?</w:p>`)
	xmlTagStripper := regexp.MustCompile(`<[^>]+>`)
	tagSet := make(map[string]bool)

	// Buscar tags en los archivos XML del docx (document.xml, headers, footers)
	for _, f := range r.File {
		if !strings.HasSuffix(f.Name, ".xml") {
			continue
		}

		rc, err := f.Open()
		if err != nil {
			continue
		}

		content, err := io.ReadAll(rc)
		rc.Close()
		if err != nil {
			continue
		}

		xmlStr := string(content)

		// Estrategia 1: Extraer por párrafo (<w:p>) y limpiar XML
		// Esto maneja el caso donde Word divide {{tag}} en múltiples <w:r> runs
		paragraphs := paragraphPattern.FindAllString(xmlStr, -1)
		for _, para := range paragraphs {
			// Quitar TODAS las etiquetas XML, dejando solo texto plano
			rawText := xmlTagStripper.ReplaceAllString(para, "")
			// Buscar tags {{...}} en el texto limpio del párrafo
			matches := tagPattern.FindAllStringSubmatch(rawText, -1)
			for _, match := range matches {
				if len(match) > 1 {
					tag := strings.TrimSpace(match[1])
					if tag != "" {
						tagSet[tag] = true
					}
				}
			}
		}

		// Estrategia 2 (fallback): Concatenar todo el texto <w:t> del archivo
		// Por si la estructura no usa <w:p> estándar
		textPattern := regexp.MustCompile(`<w:t[^>]*>([^<]*)</w:t>`)
		textMatches := textPattern.FindAllStringSubmatch(xmlStr, -1)
		var fullText strings.Builder
		for _, m := range textMatches {
			if len(m) > 1 {
				fullText.WriteString(m[1])
			}
		}
		matches := tagPattern.FindAllStringSubmatch(fullText.String(), -1)
		for _, match := range matches {
			if len(match) > 1 {
				tag := strings.TrimSpace(match[1])
				if tag != "" {
					tagSet[tag] = true
				}
			}
		}
	}

	// Convertir set a slice
	tags := make([]string, 0, len(tagSet))
	for tag := range tagSet {
		tags = append(tags, tag)
	}
	return tags, nil
}

// SubirPlantilla permite al usuario seleccionar un .docx y lo guarda como plantilla
func (s *TemplateService) SubirPlantilla(nombre string, descripcion string) (*management.Plantilla, error) {
	if s.ctx == nil {
		return nil, errors.New("contexto no inicializado")
	}

	if strings.TrimSpace(nombre) == "" {
		return nil, errors.New("el nombre de la plantilla es requerido")
	}

	filePath, err := wailsRuntime.OpenFileDialog(s.ctx, wailsRuntime.OpenDialogOptions{
		Title: "Seleccionar Plantilla Word",
		Filters: []wailsRuntime.FileFilter{
			{DisplayName: "Documentos Word", Pattern: "*.docx"},
		},
	})
	if err != nil {
		return nil, err
	}
	if filePath == "" {
		return nil, nil // Usuario canceló
	}

	// Extraer tags antes de copiar
	tags, err := extractTagsFromDocx(filePath)
	if err != nil {
		return nil, fmt.Errorf("error analizando la plantilla: %v", err)
	}

	// Copiar archivo a carpeta de plantillas
	destDir, err := s.getTemplatesDir()
	if err != nil {
		return nil, err
	}

	ext := filepath.Ext(filePath)
	if ext == "" {
		ext = ".docx"
	}

	// Crear nombre seguro para el archivo
	safeFileName := fmt.Sprintf("TPL_%d%s", time.Now().UnixNano(), ext)
	destPath := filepath.Join(destDir, safeFileName)

	srcFile, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("no se pudo leer el archivo original: %v", err)
	}
	defer srcFile.Close()

	dstFile, err := os.Create(destPath)
	if err != nil {
		return nil, fmt.Errorf("no se pudo crear el archivo destino: %v", err)
	}
	defer dstFile.Close()

	if _, err := io.Copy(dstFile, srcFile); err != nil {
		return nil, fmt.Errorf("error copiando archivo: %v", err)
	}

	ahora := time.Now().Format("2006-01-02 15:04:05")

	plantilla := management.Plantilla{
		Nombre:            strings.TrimSpace(nombre),
		Descripcion:       strings.TrimSpace(descripcion),
		RutaArchivo:       destPath,
		Tags:              common.JSONMap[management.PlantillaTags]{Data: management.PlantillaTags{Tags: tags}},
		FechaCreacion:     ahora,
		FechaModificacion: ahora,
	}

	if err := s.db.Create(&plantilla).Error; err != nil {
		// Si falla la BD, limpiar el archivo copiado
		os.Remove(destPath)
		return nil, fmt.Errorf("error al guardar plantilla en base de datos: %v", err)
	}

	return &plantilla, nil
}

// ListarPlantillas devuelve todas las plantillas registradas
func (s *TemplateService) ListarPlantillas() ([]management.Plantilla, error) {
	var plantillas []management.Plantilla
	if err := s.db.Order("fecha_creacion DESC").Find(&plantillas).Error; err != nil {
		return nil, err
	}

	// Verificar que los archivos existan (marcar los que no)
	for i := range plantillas {
		if _, err := os.Stat(plantillas[i].RutaArchivo); os.IsNotExist(err) {
			plantillas[i].RutaArchivo = "" // Indicar que el archivo no existe
		}
	}

	return plantillas, nil
}

// EliminarPlantilla elimina una plantilla y su archivo asociado
func (s *TemplateService) EliminarPlantilla(id uint) error {
	var plantilla management.Plantilla
	if err := s.db.First(&plantilla, id).Error; err != nil {
		return errors.New("plantilla no encontrada")
	}

	// Eliminar archivo físico
	if plantilla.RutaArchivo != "" {
		if _, err := os.Stat(plantilla.RutaArchivo); err == nil {
			os.Remove(plantilla.RutaArchivo)
		}
	}

	return s.db.Delete(&management.Plantilla{}, id).Error
}

// ActualizarPlantilla actualiza nombre/descripción de una plantilla
func (s *TemplateService) ActualizarPlantilla(id uint, nombre string, descripcion string) (*management.Plantilla, error) {
	var plantilla management.Plantilla
	if err := s.db.First(&plantilla, id).Error; err != nil {
		return nil, errors.New("plantilla no encontrada")
	}

	if strings.TrimSpace(nombre) != "" {
		plantilla.Nombre = strings.TrimSpace(nombre)
	}
	plantilla.Descripcion = strings.TrimSpace(descripcion)
	plantilla.FechaModificacion = time.Now().Format("2006-01-02 15:04:05")

	if err := s.db.Save(&plantilla).Error; err != nil {
		return nil, fmt.Errorf("error al actualizar: %v", err)
	}

	return &plantilla, nil
}

// ReemplazarArchivoPlantilla permite cambiar el archivo .docx de una plantilla existente
func (s *TemplateService) ReemplazarArchivoPlantilla(id uint) (*management.Plantilla, error) {
	if s.ctx == nil {
		return nil, errors.New("contexto no inicializado")
	}

	var plantilla management.Plantilla
	if err := s.db.First(&plantilla, id).Error; err != nil {
		return nil, errors.New("plantilla no encontrada")
	}

	filePath, err := wailsRuntime.OpenFileDialog(s.ctx, wailsRuntime.OpenDialogOptions{
		Title: "Seleccionar Nueva Plantilla Word",
		Filters: []wailsRuntime.FileFilter{
			{DisplayName: "Documentos Word", Pattern: "*.docx"},
		},
	})
	if err != nil {
		return nil, err
	}
	if filePath == "" {
		return nil, nil // Canceló
	}

	// Extraer nuevos tags
	tags, err := extractTagsFromDocx(filePath)
	if err != nil {
		return nil, fmt.Errorf("error analizando la plantilla: %v", err)
	}

	// Eliminar archivo anterior
	if plantilla.RutaArchivo != "" {
		if _, err := os.Stat(plantilla.RutaArchivo); err == nil {
			os.Remove(plantilla.RutaArchivo)
		}
	}

	// Copiar nuevo archivo
	destDir, err := s.getTemplatesDir()
	if err != nil {
		return nil, err
	}

	ext := filepath.Ext(filePath)
	if ext == "" {
		ext = ".docx"
	}

	safeFileName := fmt.Sprintf("TPL_%d%s", time.Now().UnixNano(), ext)
	destPath := filepath.Join(destDir, safeFileName)

	srcFile, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("no se pudo leer el archivo: %v", err)
	}
	defer srcFile.Close()

	dstFile, err := os.Create(destPath)
	if err != nil {
		return nil, fmt.Errorf("no se pudo crear archivo destino: %v", err)
	}
	defer dstFile.Close()

	if _, err := io.Copy(dstFile, srcFile); err != nil {
		return nil, fmt.Errorf("error copiando archivo: %v", err)
	}

	plantilla.RutaArchivo = destPath
	plantilla.Tags = common.JSONMap[management.PlantillaTags]{Data: management.PlantillaTags{Tags: tags}}
	plantilla.FechaModificacion = time.Now().Format("2006-01-02 15:04:05")

	if err := s.db.Save(&plantilla).Error; err != nil {
		return nil, fmt.Errorf("error al actualizar plantilla: %v", err)
	}

	return &plantilla, nil
}

// AbrirPlantillaEnEditor abre el archivo .docx con la aplicación predeterminada del sistema
func (s *TemplateService) AbrirPlantillaEnEditor(id uint) error {
	var plantilla management.Plantilla
	if err := s.db.First(&plantilla, id).Error; err != nil {
		return errors.New("plantilla no encontrada")
	}

	if plantilla.RutaArchivo == "" {
		return errors.New("la plantilla no tiene archivo asociado")
	}

	if _, err := os.Stat(plantilla.RutaArchivo); os.IsNotExist(err) {
		return errors.New("el archivo de la plantilla no existe en el disco")
	}

	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", "", plantilla.RutaArchivo)
	case "darwin":
		cmd = exec.Command("open", plantilla.RutaArchivo)
	default:
		cmd = exec.Command("xdg-open", plantilla.RutaArchivo)
	}

	return cmd.Start()
}

// RecargarTagsPlantilla re-analiza el archivo y actualiza los tags extraídos
func (s *TemplateService) RecargarTagsPlantilla(id uint) (*management.Plantilla, error) {
	var plantilla management.Plantilla
	if err := s.db.First(&plantilla, id).Error; err != nil {
		return nil, errors.New("plantilla no encontrada")
	}

	if plantilla.RutaArchivo == "" {
		return nil, errors.New("la plantilla no tiene archivo asociado")
	}

	tags, err := extractTagsFromDocx(plantilla.RutaArchivo)
	if err != nil {
		return nil, fmt.Errorf("error analizando la plantilla: %v", err)
	}

	plantilla.Tags = common.JSONMap[management.PlantillaTags]{Data: management.PlantillaTags{Tags: tags}}
	plantilla.FechaModificacion = time.Now().Format("2006-01-02 15:04:05")

	if err := s.db.Save(&plantilla).Error; err != nil {
		return nil, fmt.Errorf("error al actualizar tags: %v", err)
	}

	return &plantilla, nil
}

// getCertificatesDir devuelve la carpeta donde se guardan los certificados generados
func (s *TemplateService) getCertificatesDir() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", errors.New("no se pudo obtener carpeta de usuario")
	}
	dir := filepath.Join(homeDir, "Documents", "SistemaDECE", "Certificados")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("error creando carpeta de certificados: %v", err)
	}
	return dir, nil
}

// ObtenerDatosCertificado pre-llena los tags de una plantilla con datos del estudiante
func (s *TemplateService) ObtenerDatosCertificado(plantillaID uint, estudianteID uint) (map[string]string, error) {
	// Obtener plantilla con sus tags
	var plantilla management.Plantilla
	if err := s.db.First(&plantilla, plantillaID).Error; err != nil {
		return nil, errors.New("plantilla no encontrada")
	}

	tags := plantilla.Tags.Data.Tags
	if len(tags) == 0 {
		return nil, errors.New("la plantilla no tiene tags definidos")
	}

	// Obtener datos del estudiante
	var estudiante student.Estudiante
	if err := s.db.First(&estudiante, estudianteID).Error; err != nil {
		return nil, errors.New("estudiante no encontrado")
	}

	// Obtener matrícula actual con curso y nivel
	var matricula enrollment.Matricula
	s.db.Preload("Curso.Nivel").Preload("Curso.Periodo").
		Joins("JOIN cursos ON cursos.id = matriculas.curso_id").
		Joins("JOIN periodo_lectivos ON periodo_lectivos.id = cursos.periodo_id AND periodo_lectivos.es_activo = true").
		Where("matriculas.estudiante_id = ?", estudianteID).
		First(&matricula)

	// Obtener usuario actual (admin)
	var currentUser security.Usuario
	s.db.Where("rol = ? AND activo = true", "admin").First(&currentUser)

	// Verificar si tiene historial (llamados de atención o casos)
	var countLlamados int64
	s.db.Model(&tracking.LlamadoAtencion{}).
		Joins("JOIN matriculas ON matriculas.id = llamados_atencion.matricula_id").
		Where("matriculas.estudiante_id = ?", estudianteID).
		Count(&countLlamados)

	var countCasos int64
	s.db.Model(&tracking.CasoSensible{}).
		Where("estudiante_id = ?", estudianteID).
		Count(&countCasos)

	tieneHistorial := countLlamados > 0 || countCasos > 0

	// Preparar datos de fecha actual
	now := time.Now()
	meses := []string{
		"", "enero", "febrero", "marzo", "abril", "mayo", "junio",
		"julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
	}

	// Construir curso completo
	cursoCompleto := ""
	paralelo := ""
	if matricula.ID > 0 {
		if matricula.Curso.Nivel.NombreCompleto != "" {
			cursoCompleto = matricula.Curso.Nivel.NombreCompleto
		} else {
			cursoCompleto = matricula.Curso.Nivel.Nombre
		}
		paralelo = matricula.Curso.Paralelo
	}

	// Pre-llenar el mapa de valores para cada tag
	result := make(map[string]string)
	for _, tag := range tags {
		switch tag {
		case "nombre_de_quien_suscribe":
			result[tag] = currentUser.NombreCompleto
		case "en_calidad_de":
			if currentUser.Cargo != "" {
				result[tag] = currentUser.Cargo
			} else {
				result[tag] = currentUser.Rol
			}
		case "nombres_completos_estudiante":
			result[tag] = estudiante.Apellidos + " " + estudiante.Nombres
		case "cedula_estudiante":
			result[tag] = estudiante.Cedula
		case "curso_actual_del_estudiante":
			result[tag] = cursoCompleto
		case "paralelo_actual":
			result[tag] = paralelo
		case "check_registra":
			if tieneHistorial {
				result[tag] = "■"
			} else {
				result[tag] = "☐"
			}
		case "check_no_registra":
			if tieneHistorial {
				result[tag] = "☐"
			} else {
				result[tag] = "■"
			}
		case "fecha_dias":
			result[tag] = fmt.Sprintf("%d", now.Day())
		case "fecha_mes":
			result[tag] = meses[now.Month()]
		case "fecha_anio":
			result[tag] = fmt.Sprintf("%d", now.Year())
		default:
			result[tag] = "" // Tag desconocido, dejarlo vacío para que el usuario lo llene
		}
	}

	// Asegurar que los checks estén siempre presentes y calculados
	// Esto es crucial si la plantilla no tiene los tags explícitamente registrados
	if tieneHistorial {
		result["check_registra"] = "■"
		result["check_no_registra"] = "☐"
	} else {
		result["check_registra"] = "☐"
		result["check_no_registra"] = "■"
	}

	return result, nil
}

// GenerarCertificado reemplaza los tags en la plantilla y genera el documento final
func (s *TemplateService) GenerarCertificado(plantillaID uint, estudianteID uint, valores map[string]string) (string, error) {
	// Obtener plantilla
	var plantilla management.Plantilla
	if err := s.db.First(&plantilla, plantillaID).Error; err != nil {
		return "", errors.New("plantilla no encontrada")
	}

	if plantilla.RutaArchivo == "" {
		return "", errors.New("la plantilla no tiene archivo asociado")
	}

	if _, err := os.Stat(plantilla.RutaArchivo); os.IsNotExist(err) {
		return "", errors.New("el archivo de la plantilla no existe en el disco")
	}

	// Obtener nombre del estudiante para el nombre del archivo
	var estudiante student.Estudiante
	if err := s.db.First(&estudiante, estudianteID).Error; err != nil {
		return "", errors.New("estudiante no encontrado")
	}

	// Guardar el documento generado
	certDir, err := s.getCertificatesDir()
	if err != nil {
		return "", err
	}

	safeStudentName := strings.ReplaceAll(estudiante.Apellidos+"_"+estudiante.Nombres, " ", "_")
	fileName := fmt.Sprintf("CERT_%s_%d.docx", safeStudentName, time.Now().Unix())
	outputPath := filepath.Join(certDir, fileName)

	// Abrir docx como ZIP y procesar XML
	err = replaceTagsInDocx(plantilla.RutaArchivo, outputPath, valores)
	if err != nil {
		return "", fmt.Errorf("error al generar certificado: %v", err)
	}

	// Abrir el archivo generado
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", "", outputPath)
	case "darwin":
		cmd = exec.Command("open", outputPath)
	default:
		cmd = exec.Command("xdg-open", outputPath)
	}
	cmd.Start()

	return outputPath, nil
}

// replaceTagsInDocx abre el .docx, reemplaza {{tag}} por sus valores en los XML internos,
// y escribe un nuevo .docx con los reemplazos aplicados.
func replaceTagsInDocx(inputPath, outputPath string, valores map[string]string) error {
	r, err := zip.OpenReader(inputPath)
	if err != nil {
		return fmt.Errorf("error abriendo plantilla: %v", err)
	}
	defer r.Close()

	// Crear archivo de salida
	outFile, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("error creando archivo de salida: %v", err)
	}
	defer outFile.Close()

	w := zip.NewWriter(outFile)
	defer w.Close()

	// Patrones para manejar tags fragmentados
	paragraphPattern := regexp.MustCompile(`(?s)(<w:p[ >].*?</w:p>)`)
	runPattern := regexp.MustCompile(`(?s)<w:r[ >].*?</w:r>`)
	textContentPattern := regexp.MustCompile(`(?s)<w:t[^>]*>([^<]*)</w:t>`)

	for _, f := range r.File {
		rc, err := f.Open()
		if err != nil {
			return err
		}
		content, err := io.ReadAll(rc)
		rc.Close()
		if err != nil {
			return err
		}

		// Solo procesar archivos XML relevantes
		if strings.HasSuffix(f.Name, ".xml") &&
			(strings.Contains(f.Name, "document") ||
				strings.Contains(f.Name, "header") ||
				strings.Contains(f.Name, "footer")) {

			xmlStr := string(content)

			// Procesar párrafo por párrafo para manejar tags fragmentados
			xmlStr = paragraphPattern.ReplaceAllStringFunc(xmlStr, func(paragraph string) string {
				// Extraer texto completo del párrafo concatenando todos los <w:t>
				textMatches := textContentPattern.FindAllStringSubmatch(paragraph, -1)
				var fullText strings.Builder
				for _, m := range textMatches {
					if len(m) > 1 {
						fullText.WriteString(m[1])
					}
				}

				rawText := fullText.String()

				// Verificar si hay algún tag {{...}} en el texto concatenado
				hasTag := false
				for tag := range valores {
					// Check simple
					if strings.Contains(rawText, "{{"+tag+"}}") {
						hasTag = true
						break
					}
					// Check con espacios (regex) e insensitive
					tagName := regexp.QuoteMeta(tag)
					if ok, _ := regexp.MatchString(`(?i)\{\{\s*`+tagName+`\s*\}\}`, rawText); ok {
						hasTag = true
						break
					}
				}

				if !hasTag {
					return paragraph // Sin cambios
				}

				// Hay tags: hacer el reemplazo en el texto concatenado
				replacedText := rawText
				for tag, valor := range valores {
					// Reemplazo exacto
					replacedText = strings.ReplaceAll(replacedText, "{{"+tag+"}}", valor)

					// Reemplazo flexible con regex e insensitive case
					tagName := regexp.QuoteMeta(tag)
					re := regexp.MustCompile(`(?i)\{\{\s*` + tagName + `\s*\}\}`)
					replacedText = re.ReplaceAllString(replacedText, valor)
				}

				// Estrategia: poner todo el texto reemplazado en el primer <w:r>
				// y vaciar los demás <w:r> que contengan texto
				runs := runPattern.FindAllString(paragraph, -1)
				if len(runs) == 0 {
					return paragraph
				}

				firstTextRun := true
				result := paragraph

				for _, run := range runs {
					if !textContentPattern.MatchString(run) {
						continue // Este run no tiene texto
					}

					if firstTextRun {
						// Primer run con texto: reemplazar su contenido con el texto completo
						newRun := textContentPattern.ReplaceAllStringFunc(run, func(match string) string {
							// Preservar el tag de apertura <w:t...> y reemplazar contenido
							openTag := match[:strings.Index(match, ">")+1]
							return openTag + replacedText + "</w:t>"
						})
						// Solo tomar el primer <w:t> y quitar duplicados
						firstWT := textContentPattern.FindString(newRun)
						if firstWT != "" {
							newRunClean := textContentPattern.ReplaceAllString(newRun, "")
							// Insertar el primer w:t de vuelta antes del cierre </w:r>
							newRunClean = strings.Replace(newRunClean, "</w:r>", firstWT+"</w:r>", 1)
							result = strings.Replace(result, run, newRunClean, 1)
						}
						firstTextRun = false
					} else {
						// Demás runs con texto: vaciar su contenido
						cleanedRun := textContentPattern.ReplaceAllStringFunc(run, func(match string) string {
							openTag := match[:strings.Index(match, ">")+1]
							return openTag + "</w:t>"
						})
						result = strings.Replace(result, run, cleanedRun, 1)
					}
				}

				return result
			})

			content = []byte(xmlStr)
		}

		// Escribir el archivo (modificado o no) al nuevo ZIP
		header, err := zip.FileInfoHeader(f.FileInfo())
		if err != nil {
			return err
		}
		header.Name = f.Name
		header.Method = f.Method

		writer, err := w.CreateHeader(header)
		if err != nil {
			return err
		}
		_, err = writer.Write(content)
		if err != nil {
			return err
		}
	}

	return nil
}
