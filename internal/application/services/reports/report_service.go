package reports

import (
	faculty "dece/internal/application/services/faculty"
	security "dece/internal/application/services/security"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"

	"github.com/johnfercher/maroto/v2"
	"github.com/johnfercher/maroto/v2/pkg/components/text"
	"github.com/johnfercher/maroto/v2/pkg/config"
	"github.com/johnfercher/maroto/v2/pkg/consts/align"
	"github.com/johnfercher/maroto/v2/pkg/consts/fontstyle"
	"github.com/johnfercher/maroto/v2/pkg/props"
)

type ReportService struct {
	instService    *security.InstitutionService
	teacherService *faculty.TeacherService
}

func NewReportService(instService *security.InstitutionService, teacherService *faculty.TeacherService) *ReportService {
	return &ReportService{
		instService:    instService,
		teacherService: teacherService,
	}
}

func (s *ReportService) GenerarReporteInstitucional() (string, error) {
	configData, err := s.instService.ObtenerConfiguracion()
	if err != nil {
		return "", err
	}

	cfg := config.NewBuilder().
		WithPageNumber().
		WithLeftMargin(15).
		WithTopMargin(15).
		WithRightMargin(15).
		Build()

	m := maroto.New(cfg)

	m.AddRow(12,
		text.NewCol(12, configData.Nombre, props.Text{
			Size:  16,
			Style: fontstyle.Bold,
			Align: align.Center,
		}),
	)
	m.AddRow(10,
		text.NewCol(12, "Reporte Institucional", props.Text{
			Size:  12,
			Style: fontstyle.Italic,
			Align: align.Center,
		}),
	)
	m.AddRow(10,
		text.NewCol(12, fmt.Sprintf("Código AMIE: %s", configData.CodigoAMIE), props.Text{
			Size:  10,
			Align: align.Center,
		}),
	)

	m.AddRow(10)

	m.AddRow(10,
		text.NewCol(12, "Datos Generales", props.Text{
			Size:  12,
			Style: fontstyle.Bold,
		}),
	)
	m.AddRow(1,
		text.NewCol(12, "___________________________________________________________________", props.Text{
			Size: 6,
		}),
	)
	m.AddRow(5)

	m.AddRow(8,
		text.NewCol(3, "Distrito:", props.Text{Style: fontstyle.Bold}),
		text.NewCol(3, configData.Distrito),
		text.NewCol(3, "Circuito:", props.Text{Style: fontstyle.Bold}),
		text.NewCol(3, configData.Circuito),
	)

	m.AddRow(10)
	m.AddRow(10,
		text.NewCol(12, "Ubicación Geográfica", props.Text{
			Size:  12,
			Style: fontstyle.Bold,
		}),
	)
	m.AddRow(1,
		text.NewCol(12, "___________________________________________________________________", props.Text{
			Size: 6,
		}),
	)
	m.AddRow(5)

	m.AddRow(8,
		text.NewCol(3, "Provincia:", props.Text{Style: fontstyle.Bold}),
		text.NewCol(3, configData.Ubicacion.Provincia),
		text.NewCol(3, "Cantón:", props.Text{Style: fontstyle.Bold}),
		text.NewCol(3, configData.Ubicacion.Canton),
	)
	m.AddRow(8,
		text.NewCol(3, "Parroquia:", props.Text{Style: fontstyle.Bold}),
		text.NewCol(3, configData.Ubicacion.Parroquia),
		text.NewCol(3, "Barrio/Recinto:", props.Text{Style: fontstyle.Bold}),
		text.NewCol(3, configData.Ubicacion.BarrioRecinto),
	)

	m.AddRow(10)
	m.AddRow(10,
		text.NewCol(12, "Autoridades", props.Text{
			Size:  12,
			Style: fontstyle.Bold,
		}),
	)
	m.AddRow(1,
		text.NewCol(12, "___________________________________________________________________", props.Text{
			Size: 6,
		}),
	)
	m.AddRow(5)

	addAuthorityRow := func(title, name, jornada string) {
		if name == "" {
			name = "N/A"
		}
		if jornada != "" {
			name = fmt.Sprintf("%s (%s)", name, jornada)
		}
		m.AddRow(8,
			text.NewCol(4, title+":", props.Text{Style: fontstyle.Bold}),
			text.NewCol(8, name, props.Text{}),
		)
	}

	addAuthorityRow("Rector/a", configData.Autoridades.Rector.Nombres, "")
	addAuthorityRow("Subdirector/a Matutina", configData.Autoridades.SubdirectorMatutina.Nombres, "")
	addAuthorityRow("Subdirector/a Vespertina", configData.Autoridades.SubdirectorVespertina.Nombres, "")
	addAuthorityRow("Inspector General", configData.Autoridades.InspectorGeneral.Nombres, "")
	addAuthorityRow("Subinspector", configData.Autoridades.Subinspector.Nombres, "")
	addAuthorityRow("Coordinador/a DECE", configData.Autoridades.CoordinadorDECE.Nombres, "")
	addAuthorityRow("Analista DECE 1", configData.Autoridades.AnalistaDECE1.Nombres, "")
	addAuthorityRow("Analista DECE 2", configData.Autoridades.AnalistaDECE2.Nombres, "")

	m.RegisterFooter(text.NewRow(10, fmt.Sprintf("Generado el: %s", time.Now().Format("2006-01-02 15:04:05")), props.Text{
		Size:  8,
		Align: align.Center,
		Style: fontstyle.Italic,
	}))

	document, err := m.Generate()
	if err != nil {
		return "", err
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = "."
	}
	savePath := filepath.Join(homeDir, "Documents", "SistemaDECE", "Reportes")
	if err := os.MkdirAll(savePath, os.ModePerm); err != nil {
		return "", err
	}

	fileName := fmt.Sprintf("Reporte_Institucional_%s.pdf", time.Now().Format("20060102_150405"))
	fullPath := filepath.Join(savePath, fileName)

	err = document.Save(fullPath)
	if err != nil {
		return "", err
	}

	return fullPath, nil
}

func (s *ReportService) AbrirUbicacionReporte(path string) error {
	var cmd *exec.Cmd
	dir := filepath.Dir(path)

	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("explorer", "/select,", path)
	case "darwin":
		cmd = exec.Command("open", "-R", path)
	case "linux":
		cmd = exec.Command("xdg-open", dir)
	default:
		return fmt.Errorf("unsupported platform")
	}
	return cmd.Start()
}
