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
        title: "Configuración",
        path: "/settings",
        icon: "Settings",
        /* subOptions: [
             {
                 title: "Años Lectivos",
                 path: "/settings/school-years",
                 icon: "History"
             },
             {
                 title: "Cursos",
                 path: "/settings/courses",
                 icon: "Layers"
             },
             {
                 title: "Paralelos",
                 path: "/settings/parallels",
                 icon: "Split"
             },
             {
                 title: "Datos Institución",
                 path: "/settings/institution",
                 icon: "Building2"
             }
         ]*/
    }
];
