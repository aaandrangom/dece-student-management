package services

import (
	"context"
	dto "dece/internal/application/dtos/management"
	"dece/internal/application/helpers/periodo"
	"dece/internal/domain/common"
	"dece/internal/domain/enrollment"
	"dece/internal/domain/management"
	"dece/internal/domain/security"
	"dece/internal/domain/student"
	"dece/internal/domain/tracking"
	"encoding/base64"
	"errors"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"os"
	"os/exec"
	"path/filepath"
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

// copiarArchivo copia origen a destino cerrando ambos archivos antes de volver
// (en Windows un archivo abierto no se puede borrar si algo falla después).
func copiarArchivo(origen, destino string) error {
	src, err := os.Open(origen)
	if err != nil {
		return fmt.Errorf("no se pudo leer el archivo: %v", err)
	}
	defer src.Close()

	dst, err := os.Create(destino)
	if err != nil {
		return fmt.Errorf("no se pudo crear el archivo destino: %v", err)
	}
	if _, err := io.Copy(dst, src); err != nil {
		dst.Close()
		os.Remove(destino)
		return fmt.Errorf("error copiando archivo: %v", err)
	}
	return dst.Close()
}

func mismaLista(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

// sincronizarTags vuelve a leer las etiquetas del archivo y las guarda si cambiaron.
// Así, lo que se edite en Word ("Abrir en Word") se refleja sin pasos manuales.
func (s *TemplateService) sincronizarTags(p *management.Plantilla) error {
	if p.RutaArchivo == "" {
		return nil
	}
	if _, err := os.Stat(p.RutaArchivo); err != nil {
		return nil
	}
	tags, err := extractTagsFromDocx(p.RutaArchivo)
	if err != nil {
		return err
	}
	if mismaLista(tags, p.Tags.Data.Tags) {
		return nil
	}
	labels := preserveTagLabels(tags, p.Tags.Data.TagLabels)
	p.Tags = common.JSONMap[management.PlantillaTags]{Data: management.PlantillaTags{Tags: tags, TagLabels: labels}}
	p.FechaModificacion = time.Now().Format("2006-01-02 15:04:05")
	return s.db.Model(p).Updates(map[string]interface{}{"tags": p.Tags, "fecha_modificacion": p.FechaModificacion}).Error
}

// getFirmaPath devuelve la ruta donde se almacena la imagen de firma
func (s *TemplateService) getFirmaPath() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", errors.New("no se pudo obtener carpeta de usuario")
	}
	return filepath.Join(homeDir, "Documents", "SistemaDECE", "firma.png"), nil
}

// TieneFirma verifica si existe una imagen de firma configurada
func (s *TemplateService) TieneFirma() bool {
	path, err := s.getFirmaPath()
	if err != nil {
		return false
	}
	_, err = os.Stat(path)
	return err == nil
}

// SubirFirma permite al usuario subir una imagen de firma (PNG/JPG)
func (s *TemplateService) SubirFirma() (string, error) {
	if s.ctx == nil {
		return "", errors.New("contexto no inicializado")
	}

	filePath, err := wailsRuntime.OpenFileDialog(s.ctx, wailsRuntime.OpenDialogOptions{
		Title: "Seleccionar Imagen de Firma",
		Filters: []wailsRuntime.FileFilter{
			{DisplayName: "Imágenes", Pattern: "*.png;*.jpg;*.jpeg"},
		},
	})
	if err != nil {
		return "", err
	}
	if filePath == "" {
		return "", nil // Canceló
	}

	destPath, err := s.getFirmaPath()
	if err != nil {
		return "", err
	}

	// Asegurar que la carpeta existe
	if err := os.MkdirAll(filepath.Dir(destPath), 0755); err != nil {
		return "", fmt.Errorf("error creando carpeta: %v", err)
	}

	// Copiar archivo
	srcFile, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("no se pudo leer la imagen: %v", err)
	}
	defer srcFile.Close()

	dstFile, err := os.Create(destPath)
	if err != nil {
		return "", fmt.Errorf("no se pudo guardar la imagen: %v", err)
	}
	defer dstFile.Close()

	if _, err := io.Copy(dstFile, srcFile); err != nil {
		return "", fmt.Errorf("error copiando imagen: %v", err)
	}

	return destPath, nil
}

// ObtenerFirmaBase64 devuelve la imagen de firma codificada en base64
func (s *TemplateService) ObtenerFirmaBase64() (string, error) {
	path, err := s.getFirmaPath()
	if err != nil {
		return "", err
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return "", errors.New("no se encontró la imagen de firma")
	}
	encoded := base64.StdEncoding.EncodeToString(data)
	return "data:image/png;base64," + encoded, nil
}

// ToggleIncluyeFirma activa o desactiva la firma para una plantilla
func (s *TemplateService) ToggleIncluyeFirma(id uint, incluye bool) (*management.Plantilla, error) {
	var plantilla management.Plantilla
	if err := s.db.First(&plantilla, id).Error; err != nil {
		return nil, errors.New("plantilla no encontrada")
	}
	plantilla.IncluyeFirma = incluye
	plantilla.FechaModificacion = time.Now().Format("2006-01-02 15:04:05")
	if err := s.db.Save(&plantilla).Error; err != nil {
		return nil, fmt.Errorf("error al actualizar: %v", err)
	}
	return &plantilla, nil
}

// getFirmaDimensions lee las dimensiones de la imagen de firma y las convierte a EMU
func getFirmaDimensions(firmaPath string) (widthEMU int64, heightEMU int64) {
	f, err := os.Open(firmaPath)
	if err != nil {
		return 1800000, 720000 // Default: ~5cm x 2cm
	}
	defer f.Close()

	config, _, err := image.DecodeConfig(f)
	if err != nil {
		return 1800000, 720000
	}

	// Convertir pixels a EMU (asumiendo 96 DPI)
	// 1 inch = 914400 EMU, a 96 DPI: 1px = 9525 EMU
	widthEMU = int64(config.Width) * 9525
	heightEMU = int64(config.Height) * 9525

	// Limitar a 5cm de ancho y 2cm de alto, escalando proporcionalmente. Una firma más alta
	// empuja el final del documento a una página nueva.
	maxWidthEMU, maxHeightEMU := int64(1800000), int64(720000)
	if widthEMU > maxWidthEMU {
		scale := float64(maxWidthEMU) / float64(widthEMU)
		widthEMU = maxWidthEMU
		heightEMU = int64(float64(heightEMU) * scale)
	}
	if heightEMU > maxHeightEMU {
		scale := float64(maxHeightEMU) / float64(heightEMU)
		heightEMU = maxHeightEMU
		widthEMU = int64(float64(widthEMU) * scale)
	}

	return widthEMU, heightEMU
}

// buildFirmaImageXML genera el XML de Word para insertar una imagen inline
func buildFirmaImageXML(relID string, widthEMU, heightEMU int64) string {
	return fmt.Sprintf(
		`<w:p><w:pPr><w:keepNext/><w:spacing w:before="0" w:after="0"/><w:jc w:val="center"/></w:pPr><w:r><w:drawing>`+
			`<wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">`+
			`<wp:extent cx="%d" cy="%d"/>`+
			`<wp:docPr id="99" name="Firma"/>`+
			`<wp:cNvGraphicFramePr/>`+
			`<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">`+
			`<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">`+
			`<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">`+
			`<pic:nvPicPr><pic:cNvPr id="99" name="firma.png"/><pic:cNvPicPr/></pic:nvPicPr>`+
			`<pic:blipFill>`+
			`<a:blip r:embed="%s" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>`+
			`<a:stretch><a:fillRect/></a:stretch>`+
			`</pic:blipFill>`+
			`<pic:spPr>`+
			`<a:xfrm><a:off x="0" y="0"/><a:ext cx="%d" cy="%d"/></a:xfrm>`+
			`<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>`+
			`</pic:spPr>`+
			`</pic:pic></a:graphicData></a:graphic>`+
			`</wp:inline></w:drawing></w:r></w:p>`,
		widthEMU, heightEMU, relID, widthEMU, heightEMU,
	)
}

// preserveTagLabels conserva las etiquetas personalizadas existentes para tags que siguen presentes
func preserveTagLabels(newTags []string, existingLabels map[string]string) map[string]string {
	if len(existingLabels) == 0 {
		return nil
	}
	newTagSet := make(map[string]bool, len(newTags))
	for _, t := range newTags {
		newTagSet[t] = true
	}
	result := make(map[string]string)
	for tag, label := range existingLabels {
		if newTagSet[tag] {
			result[tag] = label
		}
	}
	if len(result) == 0 {
		return nil
	}
	return result
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

	if err := copiarArchivo(filePath, destPath); err != nil {
		return nil, err
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

	// Verificar que los archivos existan (marcar los que no) y refrescar sus etiquetas
	for i := range plantillas {
		if _, err := os.Stat(plantillas[i].RutaArchivo); os.IsNotExist(err) {
			plantillas[i].RutaArchivo = "" // Indicar que el archivo no existe
			continue
		}
		s.sincronizarTags(&plantillas[i])
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

	// Copiar el archivo nuevo primero: si algo falla, la plantilla conserva el anterior.
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

	if err := copiarArchivo(filePath, destPath); err != nil {
		return nil, err
	}

	rutaAnterior := plantilla.RutaArchivo
	plantilla.RutaArchivo = destPath

	// Preservar labels existentes para tags que siguen presentes
	existingLabels := plantilla.Tags.Data.TagLabels
	newLabels := preserveTagLabels(tags, existingLabels)

	plantilla.Tags = common.JSONMap[management.PlantillaTags]{Data: management.PlantillaTags{Tags: tags, TagLabels: newLabels}}
	plantilla.FechaModificacion = time.Now().Format("2006-01-02 15:04:05")

	if err := s.db.Save(&plantilla).Error; err != nil {
		os.Remove(destPath)
		return nil, fmt.Errorf("error al actualizar plantilla: %v", err)
	}

	if rutaAnterior != "" && rutaAnterior != destPath {
		os.Remove(rutaAnterior)
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

	// Preservar labels existentes para tags que siguen presentes
	existingLabels := plantilla.Tags.Data.TagLabels
	newLabels := preserveTagLabels(tags, existingLabels)

	plantilla.Tags = common.JSONMap[management.PlantillaTags]{Data: management.PlantillaTags{Tags: tags, TagLabels: newLabels}}
	plantilla.FechaModificacion = time.Now().Format("2006-01-02 15:04:05")

	if err := s.db.Save(&plantilla).Error; err != nil {
		return nil, fmt.Errorf("error al actualizar tags: %v", err)
	}

	return &plantilla, nil
}

// ActualizarTagLabels actualiza las etiquetas personalizadas de los tags de una plantilla
func (s *TemplateService) ActualizarTagLabels(id uint, tagLabels map[string]string) (*management.Plantilla, error) {
	var plantilla management.Plantilla
	if err := s.db.First(&plantilla, id).Error; err != nil {
		return nil, errors.New("plantilla no encontrada")
	}

	plantilla.Tags.Data.TagLabels = tagLabels
	plantilla.FechaModificacion = time.Now().Format("2006-01-02 15:04:05")

	if err := s.db.Save(&plantilla).Error; err != nil {
		return nil, fmt.Errorf("error al actualizar labels de tags: %v", err)
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

// etiquetasAutomaticas son las que el sistema completa con datos del estudiante o del usuario.
var etiquetasAutomaticas = map[string]bool{
	"nombre_de_quien_suscribe":     true,
	"en_calidad_de":                true,
	"nombres_completos_estudiante": true,
	"cedula_estudiante":            true,
	"curso_actual_del_estudiante":  true,
	"paralelo_actual":              true,
	"check_registra":               true,
	"check_no_registra":            true,
	"fecha_dias":                   true,
	"fecha_mes":                    true,
	"fecha_anio":                   true,
}

// ObtenerDatosCertificado devuelve los campos de la plantilla, en el orden del documento,
// pre-llenados con datos del estudiante y del usuario que genera el certificado.
func (s *TemplateService) ObtenerDatosCertificado(plantillaID uint, estudianteID uint, usuarioID uint) (*dto.DatosCertificadoDTO, error) {
	var plantilla management.Plantilla
	if err := s.db.First(&plantilla, plantillaID).Error; err != nil {
		return nil, errors.New("plantilla no encontrada")
	}
	if err := s.sincronizarTags(&plantilla); err != nil {
		return nil, fmt.Errorf("no se pudo leer la plantilla: %v", err)
	}

	var estudiante student.Estudiante
	if err := s.db.First(&estudiante, estudianteID).Error; err != nil {
		return nil, errors.New("estudiante no encontrado")
	}

	// Matrícula del periodo que se está viendo, con curso y nivel
	var matricula enrollment.Matricula
	periodoID, _ := periodo.ConsultaID(s.db)
	s.db.Preload("Curso.Nivel").Preload("Curso.Periodo").
		Joins("JOIN cursos ON cursos.id = matriculas.curso_id").
		Where("matriculas.estudiante_id = ? AND cursos.periodo_id = ?", estudianteID, periodoID).
		Order("CASE WHEN matriculas.estado = 'Matriculado' THEN 0 ELSE 1 END, matriculas.id DESC").
		First(&matricula)

	// Quien suscribe: el usuario de la sesión; si no llega, el primer administrador activo.
	var firmante security.Usuario
	if usuarioID == 0 || s.db.Where("id = ? AND activo = ?", usuarioID, true).First(&firmante).Error != nil {
		s.db.Where("rol = ? AND activo = ?", "admin", true).First(&firmante)
	}

	var countLlamados, countCasos int64
	s.db.Model(&tracking.LlamadoAtencion{}).
		Joins("JOIN matriculas ON matriculas.id = llamados_atencion.matricula_id").
		Where("matriculas.estudiante_id = ?", estudianteID).
		Count(&countLlamados)
	s.db.Model(&tracking.CasoSensible{}).Where("estudiante_id = ?", estudianteID).Count(&countCasos)
	tieneHistorial := countLlamados > 0 || countCasos > 0

	now := time.Now()
	meses := []string{"", "enero", "febrero", "marzo", "abril", "mayo", "junio",
		"julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"}

	cursoCompleto, paralelo := "", ""
	if matricula.ID > 0 {
		cursoCompleto = matricula.Curso.Nivel.NombreCompleto
		if cursoCompleto == "" {
			cursoCompleto = matricula.Curso.Nivel.Nombre
		}
		paralelo = matricula.Curso.Paralelo
	}
	marca := func(activo bool) string {
		if activo {
			return "■"
		}
		return "☐"
	}
	cargo := firmante.Cargo
	if cargo == "" {
		cargo = firmante.Rol
	}

	valorAutomatico := map[string]string{
		"nombre_de_quien_suscribe":     firmante.NombreCompleto,
		"en_calidad_de":                cargo,
		"nombres_completos_estudiante": strings.TrimSpace(estudiante.Apellidos + " " + estudiante.Nombres),
		"cedula_estudiante":            estudiante.Cedula,
		"curso_actual_del_estudiante":  cursoCompleto,
		"paralelo_actual":              paralelo,
		"check_registra":               marca(tieneHistorial),
		"check_no_registra":            marca(!tieneHistorial),
		"fecha_dias":                   fmt.Sprintf("%d", now.Day()),
		"fecha_mes":                    meses[now.Month()],
		"fecha_anio":                   fmt.Sprintf("%d", now.Year()),
	}

	resultado := &dto.DatosCertificadoDTO{Campos: []dto.CampoCertificadoDTO{}}
	for _, tag := range plantilla.Tags.Data.Tags {
		clave := strings.ToLower(tag)
		if clave == "firma" {
			continue // se reemplaza por la imagen de firma, no es un campo del formulario
		}
		resultado.Campos = append(resultado.Campos, dto.CampoCertificadoDTO{
			Tag:        tag,
			Valor:      valorAutomatico[clave],
			Automatico: etiquetasAutomaticas[clave],
		})
	}
	return resultado, nil
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

	if err := s.sincronizarTags(&plantilla); err != nil {
		return "", fmt.Errorf("no se pudo leer la plantilla: %v", err)
	}
	// Ninguna etiqueta queda como "{{texto}}" en el certificado: las que no llegan van vacías.
	if valores == nil {
		valores = map[string]string{}
	}
	for _, tag := range plantilla.Tags.Data.Tags {
		if _, ok := valores[tag]; !ok {
			valores[tag] = ""
		}
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

	safeStudentName := nombreArchivoSeguro(estudiante.Apellidos + "_" + estudiante.Nombres)
	fileName := fmt.Sprintf("CERT_%s_%s.docx", safeStudentName, time.Now().Format("20060102_150405"))
	outputPath := filepath.Join(certDir, fileName)

	// Determinar ruta de firma si la plantilla la incluye
	firmaPath := ""
	if plantilla.IncluyeFirma {
		if fp, fpErr := s.getFirmaPath(); fpErr == nil {
			if _, statErr := os.Stat(fp); statErr == nil {
				firmaPath = fp
			}
		}
	}
	// Abrir docx como ZIP y procesar XML
	err = replaceTagsInDocx(plantilla.RutaArchivo, outputPath, valores, firmaPath)
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

// nombreArchivoSeguro quita caracteres no válidos en nombres de archivo de Windows.
func nombreArchivoSeguro(nombre string) string {
	reemplazo := strings.NewReplacer(" ", "_", "/", "-", "\\", "-", ":", "-", "*", "", "?", "", "\"", "", "<", "", ">", "", "|", "")
	return reemplazo.Replace(strings.TrimSpace(nombre))
}

// AbrirCarpetaCertificados abre en el explorador la carpeta donde se guardan los certificados.
func (s *TemplateService) AbrirCarpetaCertificados() error {
	dir, err := s.getCertificatesDir()
	if err != nil {
		return err
	}
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("explorer", dir)
	case "darwin":
		cmd = exec.Command("open", dir)
	default:
		cmd = exec.Command("xdg-open", dir)
	}
	return cmd.Start()
}
