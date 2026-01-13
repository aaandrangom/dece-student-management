package search

type SearchResultType string

const (
	ResultTypeStudent    SearchResultType = "student"
	ResultTypeNavigation SearchResultType = "navigation"
	ResultTypeAction     SearchResultType = "action"
)

type GlobalSearchResultDTO struct {
	Type        SearchResultType `json:"type"`
	ID          uint             `json:"id"`          // ID del estudiante o nulo
	Title       string           `json:"title"`       // Nombre estudiante o titulo menu
	Description string           `json:"description"` // Cedula/Curso o descripcion menu
	Route       string           `json:"route"`       // Ruta para navegar
	Icon        string           `json:"icon"`        // Nombre del icono para frontend

	// Flags especificos para estudiantes
	TieneCasoSensible bool `json:"tiene_caso_sensible"`
	TieneDisciplina   bool `json:"tiene_disciplina"`
}
