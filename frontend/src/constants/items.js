export const menuOptions = [
    {
        title: "Panel Principal",
        path: "/panel-principal",
        icon: "LayoutDashboard",
        subOptions: []
    },
    {
        title: "Institución",
        path: "/institucion",
        icon: "Building",
        subOptions: [
            {
                title: "Configuración General",
                path: "/institucion/configuracion-general",
                icon: "Sliders"
            },
            {
                title: "Usuarios del Sistema",
                path: "/institucion/usuarios-sistema",
                icon: "UserCog"
            }
        ]
    },
    {
        title: "Gestión Académica",
        path: "/gestion-academica",
        icon: "Book",
        subOptions: [
            {
                title: "Periodos Lectivos",
                path: "/gestion-academica/periodos-lectivos",
                icon: "Calendar"
            },
            {
                title: "Niveles",
                path: "/gestion-academica/niveles",
                icon: "Layers"
            },
            {
                title: "Materias",
                path: "/gestion-academica/materias",
                icon: "BookOpen"
            },
            {
                title: "Docentes",
                path: "/gestion-academica/docentes",
                icon: "Briefcase"
            },
            {
                title: "Cursos y Distributivo",
                path: "/gestion-academica/cursos-distributivo",
                icon: "School"
            }
        ]
    },
    {
        title: "Estudiantes",
        path: "/estudiantes",
        icon: "GraduationCap",
        subOptions: [
            {
                title: "Listado General",
                path: "/estudiantes/listado-general",
                icon: "Users"
            },
            {
                title: "Ficha DECE",
                path: "/estudiantes/ficha-dece",
                icon: "UserPlus"
            },
            {
                title: "Modificaciones",
                path: "/estudiantes/modificaciones",
                icon: "Archive"
            }
        ]
    },
    {
        title: "Seguimiento DECE",
        path: "/dece",
        icon: "HeartHandshake"
    },
    {
        title: "Agenda y Citas",
        path: "/agenda",
        icon: "CalendarDays",
        subOptions: [
            {
                title: "Convocatorias",
                path: "/agenda/convocatorias",
                icon: "BellRing"
            },
            {
                title: "Capacitaciones",
                path: "/agenda/capacitaciones",
                icon: "Presentation"
            }
        ]
    },
    {
        title: "Reportes",
        path: "/reportes",
        icon: "FileWarning",
        subOptions: [
            {
                title: "Ficha Acumulativa",
                path: "/reportes/ficha-acumulativa",
                icon: "FileWarning"
            },
            {
                title: "Estadístico Problemáticas",
                path: "/reportes/estadistico",
                icon: "BarChart"
            },
            {
                title: "Nómina Vulnerabilidad",
                path: "/reportes/nomina-vulnerabilidad",
                icon: "ClipboardList"
            },
            {
                title: "Bitácora de Gestión",
                path: "/reportes/bitacora-gestion",
                icon: "History"
            },
            {
                title: "Derivaciones",
                path: "/reportes/derivaciones",
                icon: "Building2"
            }
        ]
    },
    {
        title: "Herramientas",
        path: "/herramientas",
        icon: "Database",
        subOptions: [
            {
                title: "Plantillas Word",
                path: "/herramientas/plantillas",
                icon: "FolderOpen"
            }
        ]
    },
    {
        title: "Configuración",
        path: "/configuraciones",
        icon: "Settings"
    }
];
