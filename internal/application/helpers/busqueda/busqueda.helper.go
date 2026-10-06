// Package busqueda contiene la búsqueda de texto compartida por los buscadores de estudiantes.
// SQLite LIKE no ignora tildes ni mayúsculas fuera de ASCII, por eso la comparación se hace en Go.
package busqueda

import "strings"

var reemplazoTildes = strings.NewReplacer(
	"á", "a", "à", "a", "ä", "a", "â", "a",
	"é", "e", "è", "e", "ë", "e", "ê", "e",
	"í", "i", "ì", "i", "ï", "i", "î", "i",
	"ó", "o", "ò", "o", "ö", "o", "ô", "o",
	"ú", "u", "ù", "u", "ü", "u", "û", "u",
	"ñ", "n",
)

// Normalizar pasa a minúsculas y quita tildes para comparar "Quiñónez" con "quinonez".
func Normalizar(texto string) string {
	return reemplazoTildes.Replace(strings.ToLower(texto))
}

// Palabras divide la búsqueda en palabras normalizadas.
func Palabras(query string) []string {
	return strings.Fields(Normalizar(query))
}

// Coincide exige que cada palabra aparezca en alguno de los campos, en cualquier orden
// ("mateo quiñonez" encuentra a "Quiñónez Moreira, Mateo Joel").
func Coincide(palabras []string, campos ...string) bool {
	texto := Normalizar(strings.Join(campos, " "))
	for _, p := range palabras {
		if !strings.Contains(texto, p) {
			return false
		}
	}
	return true
}
