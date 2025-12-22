export const menuOptions = [
    {
        title: "Panel Principal",
        path: "/panel-principal",
        icon: "LayoutDashboard",
        subOptions: []
    },
    {
        title: "Estudiantes",
        path: "/students",
        icon: "GraduationCap",
        subOptions: [
            {
                title: "Directorio General",
                path: "/students/list",
                icon: "Users"
            },
            {
                title: "Nuevo Ingreso",
                path: "/students/new",
                icon: "UserPlus"
            },
            {
                title: "Historial de Bajas",
                path: "/students/archived",
                icon: "Archive"
            }
        ]
    },
    {
        title: "Gestión DECE",
        path: "/dece",
        icon: "HeartHandshake",
        subOptions: [
            {
                title: "Casos y Seguimiento",
                path: "/dece/cases",
                icon: "FolderOpen"
            },
            {
                title: "Disciplina y Conducta",
                path: "/dece/discipline",
                icon: "FileWarning"
            },
            {
                title: "Vulnerabilidad y Salud",
                path: "/dece/vulnerability",
                icon: "Activity"
            }
        ]
    },
    {
        title: "Académico",
        path: "/academic",
        icon: "Library",
        subOptions: [
            {
                title: "Aulas y Paralelos",
                path: "/academic/classrooms",
                icon: "School"
            },
            {
                title: "Docentes",
                path: "/academic/teachers",
                icon: "Briefcase"
            },
            {
                title: "Materias y Carga",
                path: "/academic/subjects",
                icon: "BookOpen"
            }
        ]
    },
    {
        title: "Agenda y Citas",
        path: "/agenda",
        icon: "CalendarDays",
        subOptions: [
            {
                title: "Convocatorias",
                path: "/agenda/appointments",
                icon: "BellRing"
            },
            {
                title: "Capacitaciones",
                path: "/agenda/trainings",
                icon: "Presentation"
            }
        ]
    },
    {
        title: "Configuración",
        path: "/settings",
        icon: "Settings",
        subOptions: [
            {
                title: "Años Lectivos",
                path: "/settings/school-years",
                icon: "History"
            },
            {
                title: "Usuarios del Sistema",
                path: "/settings/users",
                icon: "ShieldCheck"
            },
            {
                title: "Datos Institución",
                path: "/settings/institution",
                icon: "Building2"
            }
        ]
    }
];
