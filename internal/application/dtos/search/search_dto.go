package search

type SearchResultType string

const (
	ResultTypeStudent    SearchResultType = "student"
	ResultTypeNavigation SearchResultType = "navigation"
	ResultTypeAction     SearchResultType = "action"
)

type GlobalSearchResultDTO struct {
	Type        SearchResultType `json:"type"`
	ID          uint             `json:"id"`
	Title       string           `json:"title"`
	Description string           `json:"description"`
	Route       string           `json:"route"`
	Icon        string           `json:"icon"`

	TieneCasoSensible bool `json:"tiene_caso_sensible"`
	TieneDisciplina   bool `json:"tiene_disciplina"`
}
