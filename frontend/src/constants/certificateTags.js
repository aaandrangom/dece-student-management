// Etiquetas que el sistema completa solo al generar un certificado.
// Deben coincidir con etiquetasAutomaticas en internal/application/services/management/template.service.go.
export const ETIQUETAS_AUTOMATICAS = [
    { tag: 'nombres_completos_estudiante', label: 'Nombres completos del estudiante', grupo: 'Estudiante' },
    { tag: 'cedula_estudiante', label: 'Cédula del estudiante', grupo: 'Estudiante' },
    { tag: 'curso_actual_del_estudiante', label: 'Curso actual', grupo: 'Estudiante' },
    { tag: 'paralelo_actual', label: 'Paralelo', grupo: 'Estudiante' },
    { tag: 'check_registra', label: 'Casilla: registra antecedentes', grupo: 'Estudiante' },
    { tag: 'check_no_registra', label: 'Casilla: no registra antecedentes', grupo: 'Estudiante' },
    { tag: 'nombre_de_quien_suscribe', label: 'Nombre de quien suscribe', grupo: 'Firmante' },
    { tag: 'en_calidad_de', label: 'Cargo de quien suscribe', grupo: 'Firmante' },
    { tag: 'firma', label: 'Imagen de la firma', grupo: 'Firmante' },
    { tag: 'fecha_dias', label: 'Día actual', grupo: 'Fecha' },
    { tag: 'fecha_mes', label: 'Mes actual (en letras)', grupo: 'Fecha' },
    { tag: 'fecha_anio', label: 'Año actual', grupo: 'Fecha' },
];

const porTag = Object.fromEntries(ETIQUETAS_AUTOMATICAS.map(e => [e.tag, e]));

export const esEtiquetaAutomatica = (tag) => !!porTag[(tag || '').toLowerCase()];

// Etiqueta legible de un campo: la personalizada de la plantilla, la conocida o el nombre del tag.
export const nombreCampo = (tag, labelsPersonalizados = {}) =>
    labelsPersonalizados[tag] || porTag[(tag || '').toLowerCase()]?.label || tag.replace(/_/g, ' ');

// Los datos de la plantilla vienen como JSONMap: { tags: { Data: { tags, tag_labels } } }.
export const tagsDePlantilla = (tpl) => tpl?.tags?.Data?.tags || tpl?.tags?.tags || [];
export const labelsDePlantilla = (tpl) => tpl?.tags?.Data?.tag_labels || tpl?.tags?.tag_labels || {};
