
/**
 * Definición de pasos para el tutorial de Configuración Inicial
 * @param {Function} navigate - Hook de navegación
 * @param {Object} driverObj - Instancia del driver para controlar el flujo
 */
export const getInitialConfigSteps = (navigate, driverObj) => [
    {
        element: '#menu-institucion',
        popover: {
            title: 'Módulo Institución',
            description: 'Gestiona toda la información de tu centro educativo.',
            side: "right",
            align: 'start',
            onNextClick: () => {
                const menuLink = document.querySelector('#menu-institucion a') || document.querySelector('#menu-institucion');
                const submenu = document.querySelector('#submenu-configuracion-general');

                if (!submenu || submenu.offsetParent === null) {
                    if (menuLink) menuLink.click();
                }

                setTimeout(() => {
                    driverObj.moveNext();
                }, 400);
            }
        }
    },
    {
        element: '#submenu-configuracion-general',
        popover: {
            title: 'Configuración General',
            description: 'Accede a los datos básicos, ubicación y autoridades.',
            side: "right",
            align: 'start',
            onNextClick: () => {
                navigate('/institucion/configuracion-general');
                setTimeout(() => {
                    driverObj.moveNext();
                }, 800);
            },
            onPreviousClick: () => {
                driverObj.movePrevious();
            }
        }
    },
    {
        element: '#inst-settings-general',
        popover: {
            title: 'Datos Generales',
            description: 'Ingresa el Nombre y Código AMIE (Obligatorios).',
            side: "right",
            align: 'start',
        }
    },
    {
        element: '#inst-settings-ubicacion',
        popover: {
            title: 'Ubicación',
            description: 'Define dónde se encuentra la institución.',
            side: "top",
            align: 'start',
        }
    },
    {
        element: '#inst-settings-autoridades',
        popover: {
            title: 'Autoridades',
            description: 'Registra rector, vicerrectores e inspectores.',
            side: "top",
            align: 'start',
        }
    },
    {
        element: '#inst-settings-reporte-btn',
        popover: {
            title: 'Reportes PDF',
            description: 'Genera un documento oficial con la configuración actual.',
            side: "left",
            align: 'center',
            onNextClick: () => {
                const el = document.querySelector('#inst-settings-reporte-btn');
                if (el) el.style.pointerEvents = 'auto';
                driverObj.moveNext();
            }
        },
        onHighlightStarted: (el) => { if (el) el.style.pointerEvents = 'none'; },
        onDeselected: (el) => { if (el) el.style.pointerEvents = 'auto'; }
    },
    {
        element: '#inst-settings-guardar-btn',
        popover: {
            title: 'Guardar',
            description: 'Guarda todos los cambios.',
            side: "left",
            align: 'center',
            onNextClick: () => {
                const el = document.querySelector('#inst-settings-guardar-btn');
                if (el) el.style.pointerEvents = 'auto';

                navigate('/institucion/usuarios-sistema');
                setTimeout(() => {
                    driverObj.moveNext();
                }, 1500);
            }
        },
        onHighlightStarted: (el) => { if (el) el.style.pointerEvents = 'none'; },
        onDeselected: (el) => { if (el) el.style.pointerEvents = 'auto'; }
    },

    // SECCIÓN DE USUARIOS DEL SISTEMA
    {
        element: '#system-users-table',
        popover: {
            title: 'Usuarios del Sistema',
            description: 'Aquí puedes ver todos los usuarios registrados que tienen acceso al sistema.',
            side: "top",
            align: 'start',
            onPreviousClick: () => {
                navigate('/institucion/configuracion-general');
                setTimeout(() => driverObj.movePrevious(), 800);
            }
        }
    },
    {
        element: '#system-users-edit-btn-0',
        popover: {
            title: 'Editar Usuario',
            description: 'Haz click aquí para modificar la información del usuario (nombre, usuario, cargo y foto) o cambiar su contraseña.',
            side: "left",
            align: 'center',
            onNextClick: () => {
                const btn = document.querySelector('#system-users-edit-btn-0');
                if (btn) btn.click();

                setTimeout(() => {
                    driverObj.moveNext();
                }, 600);
            }
        }
    },
    {
        element: '#user-edit-modal-content',
        popover: {
            title: 'Formulario de Usuario',
            description: 'En este formulario puedes actualizar: <br/><ul><li>Foto de perfil</li><li>Nombre completo</li><li>Nombre de usuario (Login)</li><li>Cargo</li></ul><br/>Recuerda guardar los cambios al finalizar.',
            side: "right",
            align: 'center',
            onNextClick: () => {
                // Intentar cerrar el modal simulando click en X o botón cancelar
                // Asumimos que el usuario lo cierra o simplemente navegamos

                // Asegurar que el menú Gestión Académica esté abierto
                const menuLink = document.querySelector('#menu-gestion-academica a') || document.querySelector('#menu-gestion-academica');
                if (menuLink && (!menuLink.nextElementSibling || menuLink.nextElementSibling.offsetParent === null)) {
                    menuLink.click();
                }

                setTimeout(() => {
                    driverObj.moveNext();
                }, 800);
            }
        }
    },

    // --- GESTIÓN ACADÉMICA ---
    {
        element: '#menu-gestion-academica',
        popover: {
            title: 'Gestión Académica',
            description: 'Ahora vamos a configurar la estructura académica. Esto es <b>fundamental</b> antes de matricular estudiantes.',
            side: "right",
            align: 'start',
            onNextClick: () => {
                // Asegurar que el menú esté desplegado y navegar al primer subitem si es necesario o solo desplegar
                const submenu = document.querySelector('#submenu-periodos-lectivos');
                const menuLink = document.querySelector('#menu-gestion-academica a') || document.querySelector('#menu-gestion-academica');

                if (!submenu || submenu.offsetParent === null) {
                    if (menuLink) menuLink.click();
                }
                setTimeout(() => driverObj.moveNext(), 500);
            }
        }
    },

    // 1. PERIODOS LECTIVOS
    {
        element: '#submenu-periodos-lectivos',
        popover: {
            title: '1. Periodos Lectivos',
            description: 'El primer paso es definir el Año Lectivo (Ej. 2024-2025). Sin un periodo activo, no podrás gestionar nada más.',
            side: "right",
            onNextClick: () => {
                navigate('/gestion-academica/periodos-lectivos');
                setTimeout(() => driverObj.moveNext(), 1500);
            }
        }
    },
    {
        element: '#academic-years-table',
        popover: {
            title: 'Gestión de Periodos',
            description: 'En esta tabla verás tus años lectivos. Presta atención a las opciones:<br/><br/>🟢 <b>Activar (Power):</b> ¡Muy Importante! Debes activar el periodo actual para habilitar el sistema.<br/>✏️ <b>Editar:</b> Para corregir fechas.<br/>🔒 <b>Cerrar:</b> Para archivar años pasados.',
            side: "top"
        }
    },
    {
        element: '#academic-years-new-btn',
        popover: {
            title: 'Crear Periodo',
            description: 'Empieza creando tu primer periodo lectivo aquí.',
            side: "left"
        }
    },

    // 2. NIVELES
    {
        element: '#submenu-niveles',
        popover: {
            title: '2. Niveles Educativos',
            description: 'Luego, define los niveles que ofrece tu institución (Ej: Inicial 1, 8vo EGB, 1ro Bachillerato).',
            side: "right",
            onPreviousClick: () => {
                navigate('/gestion-academica/periodos-lectivos');
                setTimeout(() => driverObj.movePrevious(), 1000);
            },
            onNextClick: () => {
                navigate('/gestion-academica/niveles');
                setTimeout(() => driverObj.moveNext(), 1500);
            }
        }
    },
    {
        element: '#levels-table',
        popover: {
            title: 'Lista de Niveles',
            description: 'Gestiona tus niveles aquí. Puedes editarlos o eliminarlos (si no tienen cursos).',
            side: "top"
        }
    },
    {
        element: '#levels-new-btn',
        popover: {
            title: 'Crear Nivel',
            description: 'Registra cada nivel usando el campo "Orden" para jerarquizarlos correctamente (1, 2, 3...).',
            side: "left"
        }
    },

    // 3. MATERIAS
    {
        element: '#submenu-materias',
        popover: {
            title: '3. Materias',
            description: 'Crea el catálogo de asignaturas (Matemáticas, Lengua, Física, etc.).',
            side: "right",
            onNextClick: () => {
                navigate('/gestion-academica/materias');
                setTimeout(() => driverObj.moveNext(), 1500);
            }
        }
    },
    {
        element: '#subjects-table',
        popover: {
            title: 'Catálogo de Materias',
            description: 'Aquí están todas las materias disponibles para la malla curricular.',
            side: "top"
        }
    },
    {
        element: '#subjects-new-btn',
        popover: {
            title: 'Nueva Materia',
            description: 'Agrega materias y asígnales un Área Académica.',
            side: "left"
        }
    },

    // 4. DOCENTES
    {
        element: '#submenu-docentes',
        popover: {
            title: '4. Planta Docente',
            description: 'Registra a los profesores que impartirán clases.',
            side: "right",
            onNextClick: () => {
                navigate('/gestion-academica/docentes');
                setTimeout(() => driverObj.moveNext(), 1500);
            }
        }
    },
    {
        element: '#teachers-table',
        popover: {
            title: 'Directorio Docente',
            description: 'Administra tu personal. Puedes desactivar docentes sin borrar su historial usando el botón de estado.',
            side: "top"
        }
    },
    {
        element: '#teachers-new-btn',
        popover: {
            title: 'Registrar Docente',
            description: 'Ingresa los datos personales y de contacto de tus docentes.',
            side: "left"
        }
    },

    // 5. CURSOS Y DISTRIBUTIVO
    {
        element: '#submenu-cursos-distributivo',
        popover: {
            title: '5. Cursos y Distributivo',
            description: 'Finalmente, crea los cursos (paralelos) y asigna la carga horaria.',
            side: "right",
            onNextClick: () => {
                navigate('/gestion-academica/cursos-distributivo');
                setTimeout(() => driverObj.moveNext(), 1500);
            }
        }
    },
    {
        element: '#courses-new-btn',
        popover: {
            title: 'Crear Cursos',
            description: 'Vincula un Nivel con un Paralelo (A, B, C...) y una Jornada.',
            side: "left"
        }
    },
    {
        element: '#courses-table',
        popover: {
            title: 'Carga Horaria',
            description: 'Usa el botón de <b>Libro (Gestionar Carga)</b> en cada curso para asignar qué materias se dictan y qué docente las imparte.',
            side: "top"
        }
    },

    // FIN
    {
        element: '#menu-gestion-estudiantil',
        popover: {
            title: '¡Listo!',
            description: 'Con la configuración académica terminada, ya puedes inscribir estudiantes en la sección "Gestión Estudiantil".',
            side: "right"
        }
    }
];
