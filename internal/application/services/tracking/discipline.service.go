package services

import (
	"context"
	dto "dece/internal/application/dtos/tracking"
	"dece/internal/domain/common"
	"dece/internal/domain/tracking"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"gorm.io/gorm"
)

type TrackingService struct {
	db  *gorm.DB
	ctx context.Context
}

func NewTrackingService(db *gorm.DB) *TrackingService {
	return &TrackingService{db: db}
}

func (s *TrackingService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

// =============================================================================
// MÉTODOS DE NEGOCIO: GESTIÓN DE DATOS (CRUD)
// =============================================================================

// ListarLlamados obtiene el historial disciplinario de una matrícula específica.
func (s *TrackingService) ListarLlamados(matriculaID uint) ([]dto.LlamadoResumenDTO, error) {
	var llamados []tracking.LlamadoAtencion

	// Orden descendente: lo más reciente primero
	result := s.db.Where("matricula_id = ?", matriculaID).
		Order("fecha DESC").
		Find(&llamados)

	if result.Error != nil {
		return nil, result.Error
	}

	response := make([]dto.LlamadoResumenDTO, len(llamados))
	for i, l := range llamados {
		estado := "Pendiente Firma"
		if l.RepresentanteFirmo {
			estado = "Firmado / Cerrado"
		}

		response[i] = dto.LlamadoResumenDTO{
			ID:     l.ID,
			Fecha:  l.Fecha,
			Motivo: l.Motivo,
			// Accedemos al campo exacto del JSON mapeado
			Medida: l.DetalleSancion.Data.MedidaDisciplinaria,
			Estado: estado,
		}
	}

	return response, nil
}

// ObtenerLlamado devuelve todos los detalles para llenar el formulario de edición.
func (s *TrackingService) ObtenerLlamado(id uint) (*dto.GuardarLlamadoDTO, error) {
	var l tracking.LlamadoAtencion

	if err := s.db.First(&l, id).Error; err != nil {
		return nil, errors.New("llamado de atención no encontrado")
	}

	// Mapeamos los datos de DB al DTO plano
	datos := &dto.GuardarLlamadoDTO{
		ID:                      l.ID,
		MatriculaID:             l.MatriculaID,
		Fecha:                   l.Fecha,
		Motivo:                  l.Motivo,
		RepresentanteNotificado: l.RepresentanteNotificado,
		RepresentanteFirmo:      l.RepresentanteFirmo,
		MotivoNoFirma:           l.MotivoNoFirma,

		// Extraemos del JSONMap interno
		MedidaDisciplinaria:  l.DetalleSancion.Data.MedidaDisciplinaria,
		CumplioMedida:        l.DetalleSancion.Data.CumplioMedida,
		MotivoIncumplimiento: l.DetalleSancion.Data.MotivoIncumplimiento,

		// --- ASIGNAMOS LAS RUTAS PARA QUE EL FRONTEND PUEDA PREVISUALIZAR ---
		RutaActa:       l.RutaActa,
		RutaResolucion: l.DetalleSancion.Data.RutaResolucion,
	}

	return datos, nil
}

// CrearLlamado guarda o actualiza un registro, preservando archivos existentes.
func (s *TrackingService) CrearLlamado(input dto.GuardarLlamadoDTO) (*tracking.LlamadoAtencion, error) {
	var llamado tracking.LlamadoAtencion
	var rutaResolucionPrevia string
	var rutaActaPrevia string

	// 1. EDICIÓN: Recuperar datos previos para preservar rutas de archivos
	if input.ID > 0 {
		if err := s.db.First(&llamado, input.ID).Error; err != nil {
			return nil, fmt.Errorf("no se puede editar: el llamado ID %d no existe", input.ID)
		}
		// Guardamos las rutas que ya existían
		rutaActaPrevia = llamado.RutaActa
		rutaResolucionPrevia = llamado.DetalleSancion.Data.RutaResolucion
	}

	// 2. Mapeo de campos planos
	llamado.ID = input.ID
	llamado.MatriculaID = input.MatriculaID
	llamado.Fecha = input.Fecha
	llamado.Motivo = input.Motivo
	llamado.RepresentanteNotificado = input.RepresentanteNotificado
	llamado.RepresentanteFirmo = input.RepresentanteFirmo
	llamado.MotivoNoFirma = input.MotivoNoFirma

	// Restauramos la ruta del acta (nivel raíz)
	llamado.RutaActa = rutaActaPrevia

	// 3. Mapeo del JSON DetalleSancion (inyectando la ruta preservada)
	llamado.DetalleSancion = common.JSONMap[tracking.DetalleSancion]{
		Data: tracking.DetalleSancion{
			MedidaDisciplinaria:  input.MedidaDisciplinaria,
			CumplioMedida:        input.CumplioMedida,
			MotivoIncumplimiento: input.MotivoIncumplimiento,

			// Aquí inyectamos la ruta que rescatamos de la BD (si existía)
			RutaResolucion: rutaResolucionPrevia,
		},
	}

	// 4. Guardar (Upsert)
	if err := s.db.Save(&llamado).Error; err != nil {
		return nil, fmt.Errorf("error al guardar llamado de atención: %v", err)
	}

	return &llamado, nil
}

// =============================================================================
// MÉTODOS DE GESTIÓN DE ARCHIVOS (SUBIDAS)
// =============================================================================

// SubirActa copia el PDF seleccionado a la carpeta segura del sistema.
func (s *TrackingService) SubirDocumentoDisciplina(llamadoID uint, tipoDoc string, rutaOrigen string) (string, error) {
	var llamado tracking.LlamadoAtencion

	// 1. Buscar registro
	if err := s.db.First(&llamado, llamadoID).Error; err != nil {
		return "", errors.New("registro disciplinario no encontrado")
	}

	// 2. Definir Directorio Seguro
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", errors.New("no se pudo acceder a la carpeta del usuario")
	}
	destinoDir := filepath.Join(homeDir, "Documents", "SistemaDECE", "Discipline")
	if err := os.MkdirAll(destinoDir, 0755); err != nil {
		return "", fmt.Errorf("error al crear carpeta: %v", err)
	}

	// 3. Generar Nombre (prefijo dinámico)
	ext := filepath.Ext(rutaOrigen)
	if ext == "" {
		ext = ".pdf"
	}

	// Ej: acta_5_123456.pdf o resolucion_5_123456.pdf
	nuevoNombre := fmt.Sprintf("%s_%d_%d%s", tipoDoc, llamado.ID, time.Now().Unix(), ext)
	rutaDestinoCompleta := filepath.Join(destinoDir, nuevoNombre)

	// 4. Copiar Archivo
	srcFile, err := os.Open(rutaOrigen)
	if err != nil {
		return "", err
	}
	defer srcFile.Close()

	dstFile, err := os.Create(rutaDestinoCompleta)
	if err != nil {
		return "", err
	}
	defer dstFile.Close()

	if _, err := io.Copy(dstFile, srcFile); err != nil {
		return "", err
	}

	// 5. ACTUALIZAR BASE DE DATOS SEGÚN EL TIPO
	var rutaAnterior string

	if tipoDoc == "acta" {
		// A. Caso Acta (Campo en raíz)
		rutaAnterior = llamado.RutaActa
		llamado.RutaActa = rutaDestinoCompleta
	} else if tipoDoc == "resolucion" {
		// B. Caso Resolución (Campo dentro del JSON)
		rutaAnterior = llamado.DetalleSancion.Data.RutaResolucion

		// Actualizamos el dato dentro del struct
		datosSancion := llamado.DetalleSancion.Data
		datosSancion.RutaResolucion = rutaDestinoCompleta

		// Reasignamos al wrapper para que GORM detecte el cambio y lo guarde
		llamado.DetalleSancion.Data = datosSancion
	} else {
		return "", errors.New("tipo de documento inválido (use 'acta' o 'resolucion')")
	}

	// 6. Limpiar archivo antiguo si existía
	if rutaAnterior != "" {
		if _, err := os.Stat(rutaAnterior); err == nil {
			os.Remove(rutaAnterior)
		}
	}

	// 7. Guardar cambios
	if err := s.db.Save(&llamado).Error; err != nil {
		return "", fmt.Errorf("archivo copiado pero error al guardar en BD: %v", err)
	}

	return rutaDestinoCompleta, nil
}

// =============================================================================
// MÉTODOS DE INTERFAZ WAILS (SELECCIÓN Y VISTA PREVIA)
// =============================================================================

// SeleccionarArchivo abre el diálogo nativo del SO y retorna la ruta del archivo elegido.
func (s *TrackingService) SeleccionarArchivo(tipo string) (string, error) {
	var filters []runtime.FileFilter

	if tipo == "pdf" {
		filters = append(filters, runtime.FileFilter{
			DisplayName: "Documentos PDF (*.pdf)",
			Pattern:     "*.pdf",
		})
	} else {
		filters = append(filters, runtime.FileFilter{
			DisplayName: "Imágenes (*.jpg;*.png)",
			Pattern:     "*.jpg;*.jpeg;*.png",
		})
	}

	// Abre el diálogo usando el contexto de Wails capturado en Startup
	selection, err := runtime.OpenFileDialog(s.ctx, runtime.OpenDialogOptions{
		Title:   "Seleccionar Archivo",
		Filters: filters,
	})

	if err != nil {
		return "", err
	}

	// Retorna la ruta absoluta del archivo seleccionado (o string vacío si canceló)
	return selection, nil
}

// LeerArchivoParaVista lee un archivo local y retorna su contenido en Base64
// para poder mostrarlo en el Frontend (<img> o <embed>).
func (s *TrackingService) LeerArchivoParaVista(ruta string) (string, error) {
	if ruta == "" {
		return "", nil
	}

	// Verificar si existe
	if _, err := os.Stat(ruta); os.IsNotExist(err) {
		return "", errors.New("el archivo no existe en la ruta especificada")
	}

	// Leer bytes
	bytes, err := os.ReadFile(ruta)
	if err != nil {
		return "", fmt.Errorf("error al leer el archivo: %v", err)
	}

	// Determinar MIME type básico
	mimeType := "application/pdf"
	ext := filepath.Ext(ruta)
	switch ext {
	case ".jpg", ".jpeg":
		mimeType = "image/jpeg"
	case ".png":
		mimeType = "image/png"
	}

	// Codificar a Base64
	base64Str := base64.StdEncoding.EncodeToString(bytes)

	// Retornar Data URI completo
	return fmt.Sprintf("data:%s;base64,%s", mimeType, base64Str), nil
}

func (s *TrackingService) BuscarEstudiantesActivos(query string) ([]dto.EstudianteDisciplinaDTO, error) {
	// Estructura temporal para recibir los datos de la query cruda o del Join
	var resultados []dto.EstudianteDisciplinaDTO

	query = "%" + query + "%"

	// LÓGICA DEL QUERY:
	// 1. Unimos Matriculas con Cursos, Periodos y Estudiantes.
	// 2. Filtramos donde el Periodo sea ACTIVO (es_activo = true).
	// 3. Filtramos por coincidencia de nombre/cédula.

	err := s.db.Table("matriculas").
		Select("estudiantes.id, matriculas.id as matricula_id, estudiantes.cedula, estudiantes.nombres, estudiantes.apellidos, estudiantes.ruta_foto, nivel_educativos.nombre || ' ' || cursos.paralelo as curso").
		Joins("JOIN estudiantes ON estudiantes.id = matriculas.estudiante_id").
		Joins("JOIN cursos ON cursos.id = matriculas.curso_id").
		Joins("JOIN nivel_educativos ON nivel_educativos.id = cursos.nivel_id").
		Joins("JOIN periodo_lectivos ON periodo_lectivos.id = cursos.periodo_id").
		Where("periodo_lectivos.es_activo = ? AND (estudiantes.cedula LIKE ? OR estudiantes.apellidos LIKE ? OR estudiantes.nombres LIKE ?)", true, query, query, query).
		Limit(20). // Limitamos para no saturar
		Scan(&resultados).Error

	if err != nil {
		return nil, fmt.Errorf("error al buscar estudiantes activos: %v", err)
	}

	return resultados, nil
}
