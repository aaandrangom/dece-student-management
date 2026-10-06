package services

import (
	"archive/zip"
	"fmt"
	"html"
	"io"
	"os"
	"regexp"
	"strings"
)

// Procesamiento de plantillas .docx: extracción y reemplazo de etiquetas {{tag}}.
//
// Word suele partir el texto de una etiqueta en varios fragmentos (<w:r><w:t>) por
// revisiones u ortografía, p. ej. "{{ced" + "ula}}". Por eso las etiquetas se buscan
// sobre el texto concatenado de cada párrafo, pero el reemplazo solo modifica el
// contenido de los <w:t> que forman la etiqueta: el resto del párrafo conserva su
// formato y el valor toma el formato que la etiqueta tiene en Word.

var (
	parrafoRe  = regexp.MustCompile(`(?s)<w:p[ >].*?</w:p>`)
	textoWtRe  = regexp.MustCompile(`(?s)<w:t(?:\s[^>]*)?>(.*?)</w:t>`)
	etiquetaRe = regexp.MustCompile(`\{\{\s*([^{}]+?)\s*\}\}`)
	firmaRe    = regexp.MustCompile(`(?i)\{\{\s*firma\s*\}\}`)
)

// esXMLDeContenido indica si el archivo interno del docx puede contener texto de la plantilla.
func esXMLDeContenido(nombre string) bool {
	if !strings.HasSuffix(nombre, ".xml") || !strings.HasPrefix(nombre, "word/") {
		return false
	}
	return strings.Contains(nombre, "document") || strings.Contains(nombre, "header") || strings.Contains(nombre, "footer")
}

// textoPlanoParrafo concatena el texto de los <w:t> de un párrafo (sin escapes XML).
func textoPlanoParrafo(parrafo string) string {
	var b strings.Builder
	for _, m := range textoWtRe.FindAllStringSubmatch(parrafo, -1) {
		b.WriteString(html.UnescapeString(m[1]))
	}
	return b.String()
}

// extractTagsFromDocx devuelve las etiquetas {{tag}} del documento en orden de aparición, sin repetir.
func extractTagsFromDocx(rutaArchivo string) ([]string, error) {
	r, err := zip.OpenReader(rutaArchivo)
	if err != nil {
		return nil, fmt.Errorf("el archivo no es un documento Word (.docx) válido: %v", err)
	}
	defer r.Close()

	// El cuerpo primero, luego encabezados y pies, para que el orden sea natural.
	var archivos []*zip.File
	for _, f := range r.File {
		if f.Name == "word/document.xml" {
			archivos = append([]*zip.File{f}, archivos...)
		} else if esXMLDeContenido(f.Name) {
			archivos = append(archivos, f)
		}
	}

	vistos := map[string]bool{}
	tags := []string{}
	for _, f := range archivos {
		rc, err := f.Open()
		if err != nil {
			continue
		}
		contenido, err := io.ReadAll(rc)
		rc.Close()
		if err != nil {
			continue
		}
		for _, parrafo := range parrafoRe.FindAllString(string(contenido), -1) {
			for _, m := range etiquetaRe.FindAllStringSubmatch(textoPlanoParrafo(parrafo), -1) {
				tag := strings.TrimSpace(m[1])
				clave := strings.ToLower(tag)
				if tag != "" && !vistos[clave] {
					vistos[clave] = true
					tags = append(tags, tag)
				}
			}
		}
	}
	return tags, nil
}

// reemplazarEtiquetasEnParrafo sustituye las etiquetas conocidas (clave en minúsculas)
// tocando solo los <w:t> que las contienen. Las etiquetas sin valor se dejan intactas.
func reemplazarEtiquetasEnParrafo(parrafo string, valores map[string]string) string {
	nodos := textoWtRe.FindAllStringSubmatchIndex(parrafo, -1)
	if len(nodos) == 0 {
		return parrafo
	}

	textos := make([]string, len(nodos))
	inicios := make([]int, len(nodos)) // posición de cada nodo en el texto concatenado
	var completo strings.Builder
	for i, n := range nodos {
		textos[i] = html.UnescapeString(parrafo[n[2]:n[3]])
		inicios[i] = completo.Len()
		completo.WriteString(textos[i])
	}
	texto := completo.String()

	coincidencias := etiquetaRe.FindAllStringSubmatchIndex(texto, -1)
	if len(coincidencias) == 0 {
		return parrafo
	}

	// nodoEn devuelve el nodo que contiene la posición pos del texto concatenado.
	nodoEn := func(pos int) int {
		i := len(inicios) - 1
		for i > 0 && inicios[i] > pos {
			i--
		}
		return i
	}

	cambio := false
	// De derecha a izquierda: así los desplazamientos de las etiquetas anteriores siguen válidos.
	for k := len(coincidencias) - 1; k >= 0; k-- {
		m := coincidencias[k]
		valor, ok := valores[strings.ToLower(strings.TrimSpace(texto[m[2]:m[3]]))]
		if !ok {
			continue
		}
		ini, fin := m[0], m[1] // fin exclusivo
		ni, nf := nodoEn(ini), nodoEn(fin-1)
		oi, of := ini-inicios[ni], fin-inicios[nf]
		if ni == nf {
			textos[ni] = textos[ni][:oi] + valor + textos[ni][of:]
		} else {
			textos[ni] = textos[ni][:oi] + valor
			for j := ni + 1; j < nf; j++ {
				textos[j] = ""
			}
			textos[nf] = textos[nf][of:]
		}
		cambio = true
	}
	if !cambio {
		return parrafo
	}

	// Reconstruir el párrafo cambiando solo el contenido de cada <w:t>.
	var out strings.Builder
	ultimo := 0
	for i, n := range nodos {
		apertura := parrafo[n[0]:n[2]]
		if strings.TrimSpace(textos[i]) != textos[i] && !strings.Contains(apertura, "xml:space") {
			apertura = strings.Replace(apertura, "<w:t", `<w:t xml:space="preserve"`, 1)
		}
		out.WriteString(parrafo[ultimo:n[0]])
		out.WriteString(apertura)
		out.WriteString(escaparXML(textos[i]))
		out.WriteString("</w:t>")
		ultimo = n[1]
	}
	out.WriteString(parrafo[ultimo:])
	return out.String()
}

func escaparXML(s string) string {
	var b strings.Builder
	for _, r := range s {
		switch r {
		case '&':
			b.WriteString("&amp;")
		case '<':
			b.WriteString("&lt;")
		case '>':
			b.WriteString("&gt;")
		case '"':
			b.WriteString("&quot;")
		case '\n', '\r', '\t':
			b.WriteRune(' ')
		default:
			b.WriteRune(r)
		}
	}
	return b.String()
}

// replaceTagsInDocx genera outputPath a partir de la plantilla reemplazando las etiquetas.
// Si firmaPath no está vacío, el párrafo con {{firma}} se reemplaza por la imagen de la firma;
// si está vacío, {{firma}} se elimina del texto.
func replaceTagsInDocx(inputPath, outputPath string, valores map[string]string, firmaPath string) (errFinal error) {
	r, err := zip.OpenReader(inputPath)
	if err != nil {
		return fmt.Errorf("error abriendo plantilla: %v", err)
	}
	defer r.Close()

	outFile, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("error creando archivo de salida: %v", err)
	}
	w := zip.NewWriter(outFile)
	defer func() {
		if err := w.Close(); err != nil && errFinal == nil {
			errFinal = err
		}
		if err := outFile.Close(); err != nil && errFinal == nil {
			errFinal = err
		}
		if errFinal != nil {
			os.Remove(outputPath) // no dejar certificados a medio escribir
		}
	}()

	// Claves en minúsculas: las etiquetas se reconocen sin importar mayúsculas ni espacios.
	porClave := make(map[string]string, len(valores)+1)
	for k, v := range valores {
		porClave[strings.ToLower(strings.TrimSpace(k))] = v
	}

	// {{firma}} nunca queda como texto: en el cuerpo se cambia por la imagen (si hay firma)
	// y en el resto de casos se elimina.
	hasFirma := firmaPath != ""
	porClave["firma"] = ""
	firmaRelID := "rIdFirmaImg"
	var firmaWidthEMU, firmaHeightEMU int64
	if hasFirma {
		firmaWidthEMU, firmaHeightEMU = getFirmaDimensions(firmaPath)
	}

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

		if hasFirma && f.Name == "word/_rels/document.xml.rels" {
			relEntry := fmt.Sprintf(`<Relationship Id="%s" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/firma_cert.png"/>`, firmaRelID)
			content = []byte(strings.Replace(string(content), "</Relationships>", relEntry+"</Relationships>", 1))
		}
		if hasFirma && f.Name == "[Content_Types].xml" && !strings.Contains(string(content), `Extension="png"`) {
			content = []byte(strings.Replace(string(content), "</Types>", `<Default Extension="png" ContentType="image/png"/></Types>`, 1))
		}

		if esXMLDeContenido(f.Name) {
			xmlStr := parrafoRe.ReplaceAllStringFunc(string(content), func(parrafo string) string {
				if hasFirma && f.Name == "word/document.xml" && firmaRe.MatchString(textoPlanoParrafo(parrafo)) {
					// La imagen va en su propio párrafo; el resto del texto (p. ej. la línea
					// "_____" de la firma) se conserva debajo.
					imagen := buildFirmaImageXML(firmaRelID, firmaWidthEMU, firmaHeightEMU)
					resto := reemplazarEtiquetasEnParrafo(parrafo, porClave)
					if strings.TrimSpace(textoPlanoParrafo(resto)) == "" {
						return imagen
					}
					return imagen + resto
				}
				return reemplazarEtiquetasEnParrafo(parrafo, porClave)
			})
			if f.Name == "word/document.xml" {
				xmlStr = quitarParrafosVaciosFinales(xmlStr)
			}
			content = []byte(xmlStr)
		}

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
		if _, err := writer.Write(content); err != nil {
			return err
		}
	}

	if hasFirma {
		firmaContent, err := os.ReadFile(firmaPath)
		if err != nil {
			return fmt.Errorf("error leyendo imagen de firma: %v", err)
		}
		firmaWriter, err := w.Create("word/media/firma_cert.png")
		if err != nil {
			return fmt.Errorf("error agregando firma al documento: %v", err)
		}
		if _, err := firmaWriter.Write(firmaContent); err != nil {
			return fmt.Errorf("error escribiendo firma: %v", err)
		}
	}
	return nil
}

// quitarParrafosVaciosFinales elimina los párrafos vacíos al final del cuerpo del documento.
// Las plantillas suelen terminar con líneas en blanco que, si el contenido crece (una firma,
// un nombre largo), pasan a una página nueva que queda en blanco.
func quitarParrafosVaciosFinales(doc string) string {
	finCuerpo := strings.LastIndex(doc, "</w:body>")
	if finCuerpo < 0 {
		return doc
	}
	// El sectPr del cuerpo (márgenes, encabezados) va justo antes de </w:body> y se conserva.
	limite := finCuerpo
	if i := strings.LastIndex(doc[:finCuerpo], "<w:sectPr"); i >= 0 && !strings.Contains(doc[i:finCuerpo], "</w:p>") {
		limite = i
	}

	for {
		cola := strings.TrimRight(doc[:limite], " \t\r\n")
		if !strings.HasSuffix(cola, "</w:p>") {
			return doc
		}
		inicio := ultimoInicioParrafo(cola)
		if inicio < 0 {
			return doc
		}
		// Siempre es un párrafo del nivel del cuerpo: si el documento terminara en una tabla,
		// la cola acabaría en </w:tbl> y el bucle se detiene arriba.
		// Se conserva al menos un párrafo antes, para no dejar el cuerpo vacío.
		if !parrafoVacio(cola[inicio:]) || !strings.Contains(cola[:inicio], "</w:p>") {
			return doc
		}
		doc = doc[:inicio] + doc[len(cola):]
		limite -= len(cola) - inicio
	}
}

// ultimoInicioParrafo devuelve la posición del "<w:p>" o "<w:p ..." que abre el último párrafo.
func ultimoInicioParrafo(s string) int {
	for i := len(s); i > 0; {
		j := strings.LastIndex(s[:i], "<w:p")
		if j < 0 {
			return -1
		}
		if j+4 < len(s) && (s[j+4] == ' ' || s[j+4] == '>') {
			return j
		}
		i = j
	}
	return -1
}

// parrafoVacio: sin texto visible, imágenes, saltos de página ni cambios de sección.
func parrafoVacio(p string) bool {
	for _, marca := range []string{"<w:drawing", "<w:pict", "<w:object", "<w:sectPr", `w:type="page"`, "<w:fldChar", "<w:txbxContent"} {
		if strings.Contains(p, marca) {
			return false
		}
	}
	return strings.TrimSpace(textoPlanoParrafo(p)) == ""
}
