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
                title: "Matriculación",
                path: "/students/enrollment",
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
                title: "Violencia y Derivaciones",
                path: "/dece/violence",
                icon: "ShieldAlert"
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
                title: "Materias",
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
        ]
    }
];
