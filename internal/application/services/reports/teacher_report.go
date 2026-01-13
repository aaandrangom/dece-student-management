package reports

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/johnfercher/maroto/v2"
	"github.com/johnfercher/maroto/v2/pkg/components/text"
	"github.com/johnfercher/maroto/v2/pkg/config"
	"github.com/johnfercher/maroto/v2/pkg/consts/align"
	"github.com/johnfercher/maroto/v2/pkg/consts/fontstyle"
	"github.com/johnfercher/maroto/v2/pkg/props"
)

func (s *ReportService) GenerarReporteDocentes() (string, error) {
	docentes, err := s.teacherService.ListarDocentes(true) // Obtener solo activos
	if err != nil {
		return "", err
	}

	configInst, _ := s.instService.ObtenerConfiguracion()

	cfg := config.NewBuilder().
		WithPageNumber().
		WithLeftMargin(15).
		WithTopMargin(15).
		WithRightMargin(15).
		Build()

	m := maroto.New(cfg)

	// Header
	m.AddRow(12,
		text.NewCol(12, configInst.Nombre, props.Text{
			Size:  16,
			Style: fontstyle.Bold,
			Align: align.Center,
		}),
	)
	m.AddRow(10,
		text.NewCol(12, "Reporte de Planta Docente", props.Text{
			Size:  14,
			Style: fontstyle.Bold,
			Align: align.Center,
		}),
	)
	m.AddRow(5)
	m.AddRow(8,
		text.NewCol(12, fmt.Sprintf("Generado el: %s", time.Now().Format("2006-01-02")), props.Text{
			Size:  10,
			Align: align.Center,
		}),
	)
	m.AddRow(10) // Spacer

	// Table Headers
	m.AddRow(10,
		text.NewCol(3, "Cédula", props.Text{Style: fontstyle.Bold, Align: align.Left}),
		text.NewCol(4, "Nombres Completos", props.Text{Style: fontstyle.Bold, Align: align.Left}),
		text.NewCol(2, "Teléfono", props.Text{Style: fontstyle.Bold, Align: align.Left}),
		text.NewCol(3, "Correo", props.Text{Style: fontstyle.Bold, Align: align.Left}),
	)
	m.AddRow(1,
		text.NewCol(12, "____________________________________________________________________________________________________________________", props.Text{
			Size: 4,
		}),
	)
	m.AddRow(5) // Spacer

	// Table Rows
	for _, docente := range docentes {
		m.AddRow(8,
			text.NewCol(3, docente.Cedula, props.Text{Size: 9}),
			text.NewCol(4, docente.NombresCompletos, props.Text{Size: 9}),
			text.NewCol(2, docente.Telefono, props.Text{Size: 9}),
			text.NewCol(3, docente.Correo, props.Text{Size: 9}),
		)
		// Add a subtle line or spacing if needed, but simple rows are often cleaner
	}

	// Footer
	m.RegisterFooter(text.NewRow(10, "Reporte generado por Sistema DECE", props.Text{
		Size:  8,
		Align: align.Center,
		Style: fontstyle.Italic,
	}))

	// Generate
	document, err := m.Generate()
	if err != nil {
		return "", err
	}

	// Save
	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = "."
	}
	savePath := filepath.Join(homeDir, "Documents", "SistemaDECE", "Reportes")
	if err := os.MkdirAll(savePath, os.ModePerm); err != nil {
		return "", err
	}

	fileName := fmt.Sprintf("Reporte_Docentes_%s.pdf", time.Now().Format("20060102_150405"))
	fullPath := filepath.Join(savePath, fileName)

	err = document.Save(fullPath)
	if err != nil {
		return "", err
	}

	return fullPath, nil
}
