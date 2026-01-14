package system

import (
	"archive/zip"
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"gorm.io/gorm"
)

type MaintenanceService struct {
	db  *gorm.DB
	ctx context.Context
}

func NewMaintenanceService(db *gorm.DB) *MaintenanceService {
	return &MaintenanceService{db: db}
}

func (s *MaintenanceService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

// Helper to get paths
func (s *MaintenanceService) getPaths() (string, string, error) {
	// DB Path
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", "", err
	}
	dbPath := filepath.Join(configDir, "SigDECE", "sigdece.db")

	// Documents Path
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", "", err
	}
	docsPath := filepath.Join(homeDir, "Documents", "SistemaDECE")

	return dbPath, docsPath, nil
}

func (s *MaintenanceService) GenerarRespaldo() (string, error) {
	// 1. Ask user where to save
	destPath, err := runtime.SaveFileDialog(s.ctx, runtime.SaveDialogOptions{
		Title:           "Guardar Copia de Seguridad",
		DefaultFilename: fmt.Sprintf("RESPALDO_DECE_%s.zip", time.Now().Format("20060102_150405")),
		Filters: []runtime.FileFilter{
			{DisplayName: "Archivo ZIP", Pattern: "*.zip"},
		},
	})

	if err != nil || destPath == "" {
		return "", nil // Cancelled
	}

	dbPath, docsPath, err := s.getPaths()
	if err != nil {
		return "", err
	}

	// 2. Create ZIP
	outFile, err := os.Create(destPath)
	if err != nil {
		return "", err
	}
	defer outFile.Close()

	w := zip.NewWriter(outFile)
	defer w.Close()

	// 3. Add DB
	if err := addFileToZip(w, dbPath, "sigdece.db"); err != nil {
		return "", fmt.Errorf("Error respaldando BD: %v", err)
	}

	// 4. Add Documents
	if err := addDirToZip(w, docsPath, "documents"); err != nil {
		fmt.Printf("Warning: Documents folder not found or empty: %v\n", err)
		// Non-critical if docs folder doesn't exist yet
	}

	return destPath, nil
}

func (s *MaintenanceService) RestaurarRespaldo() (bool, error) {
	// 1. Ask user for file
	srcPath, err := runtime.OpenFileDialog(s.ctx, runtime.OpenDialogOptions{
		Title: "Seleccionar Respaldo",
		Filters: []runtime.FileFilter{
			{DisplayName: "Archivo ZIP", Pattern: "*.zip"},
		},
	})

	if err != nil || srcPath == "" {
		return false, nil
	}

	// 2. Warn User
	selection, err := runtime.MessageDialog(s.ctx, runtime.MessageDialogOptions{
		Type:          runtime.QuestionDialog,
		Title:         "Confirmar Restauración",
		Message:       "ADVERTENCIA CRÍTICA:\n\nEsta acción borrará todos los datos actuales y los reemplazará con los del respaldo.\n\nLa aplicación se cerrará automáticamente al finalizar.\n¿Está seguro?",
		Buttons:       []string{"Sí, Restaurar", "Cancelar"},
		DefaultButton: "Cancelar",
		CancelButton:  "Cancelar",
	})

	if selection != "Sí, Restaurar" {
		return false, nil
	}

	dbPath, docsPath, err := s.getPaths()
	if err != nil {
		return false, err
	}

	// 3. Close DB Connection to release lock
	sqlDB, err := s.db.DB()
	if err == nil {
		sqlDB.Close()
	}

	// 4. Extract ZIP
	r, err := zip.OpenReader(srcPath)
	if err != nil {
		return false, err
	}
	defer r.Close()

	for _, f := range r.File {
		rc, err := f.Open()
		if err != nil {
			return false, err
		}

		if f.Name == "sigdece.db" {
			// Restore DB
			// Backup current just in case? Maybe a .bak file
			os.Rename(dbPath, dbPath+".bak")

			outFile, err := os.Create(dbPath)
			if err != nil {
				rc.Close()
				return false, err
			}
			_, err = io.Copy(outFile, rc)
			outFile.Close()
		} else if strings.HasPrefix(f.Name, "documents/") {
			// Restore Document
			relPath := strings.TrimPrefix(f.Name, "documents/")
			if relPath == "" || relPath == "/" {
				rc.Close()
				continue
			}

			destFilePath := filepath.Join(docsPath, relPath)
			if f.FileInfo().IsDir() {
				os.MkdirAll(destFilePath, os.ModePerm)
			} else {
				os.MkdirAll(filepath.Dir(destFilePath), os.ModePerm)
				outFile, err := os.Create(destFilePath)
				if err != nil {
					rc.Close()
					return false, err
				}
				_, err = io.Copy(outFile, rc)
				outFile.Close()
			}
		}
		rc.Close()
	}

	// 5. Force Quit app to ensure clean reload on next start
	runtime.Quit(s.ctx)
	return true, nil
}

// Helpers

func addFileToZip(w *zip.Writer, path string, zipPath string) error {
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	f, err := w.Create(zipPath)
	if err != nil {
		return err
	}

	_, err = io.Copy(f, file)
	return err
}

func addDirToZip(w *zip.Writer, src string, rootDest string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}

		rel, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}

		// Ensure forward slashes for zip
		zipPath := filepath.Join(rootDest, rel)
		zipPath = strings.ReplaceAll(zipPath, "\\", "/")

		return addFileToZip(w, path, zipPath)
	})
}
