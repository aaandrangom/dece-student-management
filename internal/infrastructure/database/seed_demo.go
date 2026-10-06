package database

import (
	"dece/internal/domain/academic"
	"dece/internal/domain/common"
	"dece/internal/domain/enrollment"
	"dece/internal/domain/faculty"
	"dece/internal/domain/management"
	"dece/internal/domain/security"
	"dece/internal/domain/student"
	"dece/internal/domain/tracking"
	"fmt"
	"log"
	"math/rand"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// SeedDemo llena la base con datos ficticios para pruebas manuales.
// Solo se ejecuta si no existe ningún estudiante (idempotente).
// Se activa con SEED_DEMO=true en el .env.
func SeedDemo(db *gorm.DB) error {
	var count int64
	db.Model(&student.Estudiante{}).Count(&count)
	if count > 0 {
		log.Println("SeedDemo omitido: ya existen estudiantes en la base de datos")
		return nil
	}

	s := &demoSeeder{
		r:       rand.New(rand.NewSource(42)),
		now:     time.Now(),
		cedulas: map[string]bool{},
	}

	err := db.Transaction(func(tx *gorm.DB) error {
		s.tx = tx
		steps := []func() error{
			s.usuarios,
			s.institucion,
			s.periodos,
			s.docentes,
			s.cursos,
			s.distributivo,
			s.estudiantes,
			s.matriculas,
			s.retiros,
			s.llamados,
			s.casos,
			s.convocatorias,
			s.capacitaciones,
		}
		for _, step := range steps {
			if err := step(); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return fmt.Errorf("SeedDemo: %w", err)
	}

	log.Println("SeedDemo completado: datos de prueba creados")
	return nil
}

type demoSeeder struct {
	tx      *gorm.DB
	r       *rand.Rand
	now     time.Time
	cedulas map[string]bool

	periodoActivo    academic.PeriodoLectivo
	periodoAnterior  academic.PeriodoLectivo
	niveles          []academic.NivelEducativo
	materias         []academic.Materia
	listaDocentes    []faculty.Docente
	cursosActivos    []faculty.Curso
	cursosAnteriores map[uint]faculty.Curso // nivelID -> curso del periodo anterior
	listaEstudiantes []student.Estudiante
	nivelEstudiante  map[uint]academic.NivelEducativo // estudianteID -> nivel actual
	listaMatriculas  []enrollment.Matricula           // matrículas del periodo activo
}

var (
	demoNombresM       = []string{"Mateo", "Santiago", "Sebastián", "Thiago", "Emiliano", "Joel", "Kevin", "Bryan", "Anthony", "Dylan", "Jostin", "Luis", "Carlos", "Andrés", "Josué", "Daniel", "Ángel", "Jhon", "Isaac", "Gael"}
	demoNombresF       = []string{"Valentina", "Camila", "Sofía", "Isabella", "Emily", "Ariana", "Dayana", "Nicole", "Mía", "Danna", "Ashley", "Luciana", "Génesis", "Paula", "Allison", "Victoria", "Renata", "Fernanda", "Melany", "Abigail"}
	demoApellidos      = []string{"Quiñónez", "Cortez", "Bone", "Caicedo", "Mina", "Valencia", "Angulo", "Preciado", "Montaño", "Castillo", "Zambrano", "Mendoza", "Vera", "Cedeño", "Macías", "Torres", "Andrade", "Ortiz", "Arroyo", "Estupiñán", "Hurtado", "Ramírez", "Vélez", "Moreira", "Chávez"}
	demoBarrios        = []string{"Barrio Central", "Barrio 5 de Agosto", "Cdla. Las Palmas", "Barrio La Union", "Recinto Cupa", "Barrio Nuevo Quinindé", "Cdla. Los Almendros", "Recinto Malimpia"}
	demoProfesiones    = []string{"Agricultor", "Comerciante", "Ama de casa", "Docente", "Chofer", "Albañil", "Enfermera", "Jornalero", "Costurera", "Mecánico"}
	demoInstruccion    = []string{"Primaria", "Secundaria", "Bachillerato", "Superior", "Ninguna"}
	demoActividades    = []string{"Fútbol", "Danza", "Música", "Básquet", "Dibujo", "Natación", "Ajedrez", "Teatro"}
	demoSangre         = []string{"O+", "O+", "O+", "A+", "B+", "AB+", "O-"}
	demoEntidades      = []string{"Fiscalía", "Junta Cantonal de Protección de Derechos", "Ministerio de Salud Pública", "Patronato de Amparo Social", "Distrito de Educación"}
	demoMotivosLlamado = []string{
		"Uso de celular durante la clase",
		"Agresión verbal a un compañero",
		"Inasistencias reiteradas sin justificación",
		"Pelea en el recreo",
		"Falta de respeto al docente",
		"Daño a mobiliario de la institución",
		"Salida del aula sin autorización",
		"Incumplimiento reiterado de tareas",
		"Uso inadecuado del uniforme",
		"Copia durante evaluación",
	}
	demoTiposCaso = []string{
		"Violencia intrafamiliar",
		"Acoso escolar",
		"Consumo de sustancias",
		"Negligencia familiar",
		"Ideación suicida",
		"Trabajo infantil",
		"Violencia sexual",
		"Embarazo adolescente",
	}
)

func (s *demoSeeder) pick(list []string) string { return list[s.r.Intn(len(list))] }

func (s *demoSeeder) date(t time.Time) string { return t.Format("2006-01-02") }

// diasAtras devuelve una fecha aleatoria entre hace `max` días y hace `min` días.
func (s *demoSeeder) diasAtras(min, max int) time.Time {
	return s.now.AddDate(0, 0, -(min + s.r.Intn(max-min+1)))
}

func (s *demoSeeder) telefono() string {
	return fmt.Sprintf("09%08d", s.r.Intn(100000000))
}

// cedula genera una cédula ecuatoriana válida (provincia 08, Esmeraldas) y única.
func (s *demoSeeder) cedula() string {
	for {
		d := []int{0, 8, s.r.Intn(6)}
		for i := 0; i < 6; i++ {
			d = append(d, s.r.Intn(10))
		}
		sum := 0
		for i, v := range d {
			if i%2 == 0 {
				v *= 2
				if v > 9 {
					v -= 9
				}
			}
			sum += v
		}
		d = append(d, (10-sum%10)%10)

		c := ""
		for _, v := range d {
			c += fmt.Sprint(v)
		}
		if !s.cedulas[c] {
			s.cedulas[c] = true
			return c
		}
	}
}

func (s *demoSeeder) persona(genero string) (nombres, apellidos string) {
	pool := demoNombresM
	if genero == "F" {
		pool = demoNombresF
	}
	n1, n2 := s.pick(pool), s.pick(pool)
	for n2 == n1 {
		n2 = s.pick(pool)
	}
	return n1 + " " + n2, s.pick(demoApellidos) + " " + s.pick(demoApellidos)
}

func (s *demoSeeder) usuarios() error {
	hash, err := bcrypt.GenerateFromPassword([]byte("Demo123!"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	usuarios := []security.Usuario{
		{NombreUsuario: "mvalencia", NombreCompleto: "María José Valencia Cortez", Cargo: "Analista DECE"},
		{NombreUsuario: "jcaicedo", NombreCompleto: "Jorge Luis Caicedo Mina", Cargo: "Psicólogo Educativo"},
		{NombreUsuario: "lmontano", NombreCompleto: "Lorena Patricia Montaño Bone", Cargo: "Secretaría"},
	}
	for _, u := range usuarios {
		u.ClaveHash = string(hash)
		u.Rol = "usuario"
		u.Activo = true
		u.FechaCreacion = s.now.Format("2006-01-02 15:04:05")
		if err := s.tx.Where(security.Usuario{NombreUsuario: u.NombreUsuario}).FirstOrCreate(&u).Error; err != nil {
			return err
		}
	}
	return nil
}

func (s *demoSeeder) institucion() error {
	var cfg security.ConfiguracionInstitucional
	if err := s.tx.First(&cfg).Error; err != nil {
		return err
	}
	if cfg.Autoridades.Data.Rector.Nombres != "" {
		return nil
	}

	autoridad := func(cargoJornada string) security.Autoridad {
		genero := []string{"M", "F"}[s.r.Intn(2)]
		n, a := s.persona(genero)
		return security.Autoridad{Cedula: s.cedula(), Nombres: n, Apellidos: a, Telefono: s.telefono(), Jornada: cargoJornada}
	}
	cfg.Autoridades = common.JSONMap[security.AutoridadesInstitucion]{Data: security.AutoridadesInstitucion{
		Rector:                autoridad("Matutina"),
		SubdirectorMatutina:   autoridad("Matutina"),
		SubdirectorVespertina: autoridad("Vespertina"),
		InspectorGeneral:      autoridad("Matutina"),
		Subinspector:          autoridad("Vespertina"),
		CoordinadorDECE:       autoridad("Matutina"),
		AnalistaDECE1:         autoridad("Matutina"),
		AnalistaDECE2:         autoridad("Vespertina"),
	}}
	cfg.FechaActualizacion = s.now.Format("2006-01-02 15:04:05")
	return s.tx.Save(&cfg).Error
}

func (s *demoSeeder) periodos() error {
	inicio := s.now.AddDate(0, -5, 0)
	inicio = time.Date(inicio.Year(), inicio.Month(), 1, 0, 0, 0, 0, time.Local)
	fin := inicio.AddDate(0, 10, -1)

	s.periodoAnterior = academic.PeriodoLectivo{
		Nombre:      fmt.Sprintf("%d-%d", inicio.Year()-1, fin.Year()-1),
		FechaInicio: s.date(inicio.AddDate(-1, 0, 0)),
		FechaFin:    s.date(fin.AddDate(-1, 0, 0)),
		Cerrado:     true,
	}
	s.periodoActivo = academic.PeriodoLectivo{
		Nombre:      fmt.Sprintf("%d-%d", inicio.Year(), fin.Year()),
		FechaInicio: s.date(inicio),
		FechaFin:    s.date(fin),
	}

	// Solo un periodo activo a la vez.
	if err := s.tx.Model(&academic.PeriodoLectivo{}).Where("es_activo = ?", true).Update("es_activo", false).Error; err != nil {
		return err
	}
	if err := s.tx.Where(academic.PeriodoLectivo{Nombre: s.periodoAnterior.Nombre}).FirstOrCreate(&s.periodoAnterior).Error; err != nil {
		return err
	}
	if err := s.tx.Where(academic.PeriodoLectivo{Nombre: s.periodoActivo.Nombre}).FirstOrCreate(&s.periodoActivo).Error; err != nil {
		return err
	}
	return s.tx.Model(&s.periodoActivo).Update("es_activo", true).Error
}

func (s *demoSeeder) docentes() error {
	for i := 0; i < 15; i++ {
		genero := []string{"M", "F"}[i%2]
		n, a := s.persona(genero)
		d := faculty.Docente{
			Cedula:           s.cedula(),
			NombresCompletos: a + " " + n,
			Telefono:         s.telefono(),
			Correo:           fmt.Sprintf("docente%02d@escuela3dejulio.edu.ec", i+1),
			Activo:           i != 14,
		}
		if err := s.tx.Create(&d).Error; err != nil {
			return err
		}
		s.listaDocentes = append(s.listaDocentes, d)
	}
	return nil
}

func (s *demoSeeder) cursos() error {
	if err := s.tx.Order("orden").Find(&s.niveles).Error; err != nil {
		return err
	}
	s.cursosAnteriores = map[uint]faculty.Curso{}

	activos := s.listaDocentes[:14]
	for i, nivel := range s.niveles {
		// Periodo anterior: un paralelo por nivel.
		tutorAnt := activos[i%len(activos)].ID
		ant := faculty.Curso{PeriodoID: s.periodoAnterior.ID, NivelID: nivel.ID, TutorID: &tutorAnt, Paralelo: "A", Jornada: "Matutina"}
		if err := s.tx.Create(&ant).Error; err != nil {
			return err
		}
		s.cursosAnteriores[nivel.ID] = ant

		// Periodo activo: A matutina, B vespertina.
		for j, p := range []struct{ paralelo, jornada string }{{"A", "Matutina"}, {"B", "Vespertina"}} {
			c := faculty.Curso{PeriodoID: s.periodoActivo.ID, NivelID: nivel.ID, Paralelo: p.paralelo, Jornada: p.jornada}
			if !(i == 9 && j == 1) { // 10mo B sin tutor, para probar asignación
				tutor := activos[(i*2+j)%len(activos)].ID
				c.TutorID = &tutor
			}
			if err := s.tx.Create(&c).Error; err != nil {
				return err
			}
			c.Nivel = nivel
			s.cursosActivos = append(s.cursosActivos, c)
		}
	}
	return nil
}

func (s *demoSeeder) distributivo() error {
	if err := s.tx.Find(&s.materias).Error; err != nil {
		return err
	}
	basicas := []string{"Matemáticas", "Lengua y Literatura", "Ciencias Naturales", "Estudios Sociales", "Inglés", "Educación Física", "Educación Cultural y Artística"}
	for _, c := range s.cursosActivos {
		for _, m := range s.materias {
			esBasica := false
			for _, b := range basicas {
				if m.Nombre == b {
					esBasica = true
				}
			}
			if !esBasica {
				continue
			}
			d := faculty.DistributivoMateria{CursoID: c.ID, MateriaID: m.ID, DocenteID: s.listaDocentes[s.r.Intn(14)].ID}
			if err := s.tx.Create(&d).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

func (s *demoSeeder) estudiantes() error {
	s.nivelEstudiante = map[uint]academic.NivelEducativo{}
	for _, c := range s.cursosActivos {
		for k := 0; k < 6; k++ {
			genero := []string{"M", "F"}[s.r.Intn(2)]
			n, a := s.persona(genero)
			edad := 5 + c.Nivel.Orden
			nacimiento := time.Date(s.now.Year()-edad, time.Month(1+s.r.Intn(12)), 1+s.r.Intn(28), 0, 0, 0, 0, time.Local)

			nac := student.InfoNacionalidad{}
			if s.r.Intn(15) == 0 {
				nac = student.InfoNacionalidad{EsExtranjero: true, PaisOrigen: s.pick([]string{"Colombia", "Venezuela"}), PasaporteOrDNI: fmt.Sprintf("P%07d", s.r.Intn(10000000))}
			}

			e := student.Estudiante{
				Cedula:           s.cedula(),
				Apellidos:        a,
				Nombres:          n,
				FechaNacimiento:  s.date(nacimiento),
				GeneroNacimiento: genero,
				InfoNacionalidad: common.JSONMap[student.InfoNacionalidad]{Data: nac},
				FechaCreacion:    s.diasAtras(30, 150).Format("2006-01-02 15:04:05"),
				Familiares:       s.familiares(a),
			}
			if c.Nivel.Orden >= 8 {
				e.CorreoElectronico = fmt.Sprintf("est%04d@escuela3dejulio.edu.ec", len(s.listaEstudiantes)+1)
			}
			if err := s.tx.Create(&e).Error; err != nil {
				return err
			}
			s.listaEstudiantes = append(s.listaEstudiantes, e)
			s.nivelEstudiante[e.ID] = c.Nivel
		}
	}
	return nil
}

func (s *demoSeeder) familiares(apellidosEstudiante string) []student.Familiar {
	familiar := func(parentesco, genero string, representante bool) student.Familiar {
		n, a := s.persona(genero)
		return student.Familiar{
			Cedula:               s.cedula(),
			NombresCompletos:     a + " " + n,
			Parentesco:           parentesco,
			EsRepresentanteLegal: representante,
			ViveConEstudiante:    s.r.Intn(5) != 0,
			TelefonoPersonal:     s.telefono(),
			DatosExtendidos: common.JSONMap[student.DatosFamiliar]{Data: student.DatosFamiliar{
				NivelInstruccion: s.pick(demoInstruccion),
				Profesion:        s.pick(demoProfesiones),
				LugarTrabajo:     s.pick([]string{"Quinindé", "Esmeraldas", "Santo Domingo", "Hogar", "Finca propia"}),
			}},
		}
	}

	madre := familiar("Madre", "F", true)
	padre := familiar("Padre", "M", false)
	if s.r.Intn(12) == 0 {
		padre.Fallecido = true
		padre.ViveConEstudiante = false
	}
	fams := []student.Familiar{madre, padre}
	if s.r.Intn(6) == 0 {
		// Representante distinto a los padres (abuela, tía...).
		fams[0].EsRepresentanteLegal = false
		fams = append(fams, familiar("Representante", "F", true))
	}
	return fams
}

func (s *demoSeeder) matriculas() error {
	cursoPorNivel := map[uint][]faculty.Curso{}
	for _, c := range s.cursosActivos {
		cursoPorNivel[c.NivelID] = append(cursoPorNivel[c.NivelID], c)
	}
	asignados := map[uint]int{}

	for _, e := range s.listaEstudiantes {
		nivel := s.nivelEstudiante[e.ID]
		cursos := cursoPorNivel[nivel.ID]
		curso := cursos[asignados[nivel.ID]/6]
		asignados[nivel.ID]++

		esRepetidor := s.r.Intn(20) == 0

		// Matrícula del periodo anterior (nivel previo, o el mismo si repite).
		if nivel.Orden > 1 || esRepetidor {
			nivelAnt := nivel
			if !esRepetidor {
				nivelAnt = s.niveles[nivel.Orden-2]
			}
			ant := s.nuevaMatricula(e, s.cursosAnteriores[nivelAnt.ID], false)
			ant.FechaRegistro = s.periodoAnterior.FechaInicio + " 08:30:00"
			if err := s.tx.Create(&ant).Error; err != nil {
				return err
			}
		}

		m := s.nuevaMatricula(e, curso, esRepetidor)
		if err := s.tx.Create(&m).Error; err != nil {
			return err
		}
		m.Estudiante = e
		m.Curso = curso
		s.listaMatriculas = append(s.listaMatriculas, m)
	}
	return nil
}

func (s *demoSeeder) nuevaMatricula(e student.Estudiante, c faculty.Curso, esRepetidor bool) enrollment.Matricula {
	ref := func() enrollment.MateriaReferencia {
		m := s.materias[s.r.Intn(len(s.materias))]
		return enrollment.MateriaReferencia{ID: m.ID, Nombre: m.Nombre}
	}

	edad := 5 + s.nivelEstudiante[e.ID].Orden
	salud := enrollment.DatosSalud{}
	switch s.r.Intn(8) {
	case 0:
		salud.TieneAlergias, salud.DetalleAlergia = true, s.pick([]string{"Penicilina", "Mariscos", "Polvo", "Maní"})
	case 1:
		salud.TieneDiscapacidad, salud.DetalleDiscapacidad = true, s.pick([]string{"Discapacidad auditiva leve (35%)", "Discapacidad intelectual (40%)", "Discapacidad física (30%)"})
		salud.TieneEvalPsicopedagogica = true
	case 2:
		salud.TieneEnfermedad, salud.DetalleEnfermedad = true, s.pick([]string{"Asma", "Epilepsia controlada", "Anemia"})
	case 3:
		salud.HaSufridoAccidente, salud.DetalleAccidente = true, "Fractura de brazo izquierdo"
		salud.TieneCirugias, salud.DetalleCirugia = true, "Reducción de fractura"
	}

	social := enrollment.DatosSociales{}
	if s.r.Intn(2) == 0 {
		social = enrollment.DatosSociales{PracticaActividad: true, Actividades: []string{s.pick(demoActividades)}}
	}

	esNuevo := s.nivelEstudiante[e.ID].Orden == 1 || s.r.Intn(10) == 0
	historial := enrollment.HistorialAcademico{
		EsNuevoEstudiante:   esNuevo,
		HaRepetidoAnio:      esRepetidor,
		MateriasFavoritas:   []enrollment.MateriaReferencia{ref()},
		MateriasMenosGustan: []enrollment.MateriaReferencia{ref()},
	}
	if esNuevo && s.nivelEstudiante[e.ID].Orden > 1 {
		historial.InstitucionAnterior = s.pick([]string{"Escuela Fiscal Luis Vargas Torres", "Unidad Educativa Quinindé", "Escuela Particular San José"})
		historial.ProvinciaAnterior = "Esmeraldas"
		historial.CantonAnterior = s.pick([]string{"Quinindé", "Esmeraldas", "Atacames"})
	}
	if esRepetidor {
		historial.DetalleAnioRepetido = "Repite el año por bajo rendimiento"
	}

	return enrollment.Matricula{
		EstudianteID: e.ID,
		CursoID:      c.ID,
		Estado:       "Matriculado",
		EsRepetidor:  esRepetidor,
		Antropometria: common.JSONMap[enrollment.Antropometria]{Data: enrollment.Antropometria{
			Peso:       float64(15+edad*3) + float64(s.r.Intn(80))/10,
			Talla:      float64(100+edad*5) + float64(s.r.Intn(100))/10,
			TipoSangre: s.pick(demoSangre),
		}},
		HistorialAcademico: common.JSONMap[enrollment.HistorialAcademico]{Data: historial},
		DatosSalud:         common.JSONMap[enrollment.DatosSalud]{Data: salud},
		DatosSociales:      common.JSONMap[enrollment.DatosSociales]{Data: social},
		CondicionGenero:    common.JSONMap[enrollment.CondicionGenero]{Data: enrollment.CondicionGenero{}},
		DireccionActual:    fmt.Sprintf("%s, calle %d y Av. %s", s.pick(demoBarrios), 1+s.r.Intn(20), s.pick([]string{"Simón Plata Torres", "Quito", "Esmeraldas", "Chone"})),
		FechaRegistro:      s.periodoActivo.FechaInicio + " 09:00:00",
	}
}

func (s *demoSeeder) retiros() error {
	motivos := []string{"Cambio de domicilio", "Migración familiar", "Problemas económicos", "Cambio a institución particular"}
	for i := 0; i < 4; i++ {
		m := &s.listaMatriculas[5+i*30]
		if err := s.tx.Model(m).Update("estado", "Retirado").Error; err != nil {
			return err
		}
		m.Estado = "Retirado"
		r := enrollment.RetiroEstudiante{
			MatriculaID:      m.ID,
			FechaRetiro:      s.date(s.diasAtras(10, 90)),
			Motivo:           motivos[i],
			NuevaInstitucion: s.pick([]string{"Unidad Educativa Fiscal Esmeraldas", "Escuela Fiscal Mixta Santo Domingo", "Colegio Particular La Salle"}),
			ProvinciaDestino: s.pick([]string{"Esmeraldas", "Santo Domingo de los Tsáchilas", "Pichincha", "Manabí"}),
			Observaciones:    "Representante retira documentos en secretaría",
		}
		if err := s.tx.Create(&r).Error; err != nil {
			return err
		}
	}
	return nil
}

func (s *demoSeeder) matriculaActiva() enrollment.Matricula {
	for {
		m := s.listaMatriculas[s.r.Intn(len(s.listaMatriculas))]
		if m.Estado != "Retirado" {
			return m
		}
	}
}

func (s *demoSeeder) llamados() error {
	medidas := []string{"Amonestación verbal", "Amonestación escrita", "Acción educativa disciplinaria: trabajo formativo", "Suspensión temporal de asistencia (3 días) con actividades en casa"}
	for i := 0; i < 30; i++ {
		m := s.matriculaActiva()
		fecha := s.diasAtras(0, 140)
		if i < 6 {
			fecha = s.diasAtras(0, s.now.Day()-1) // algunos en el mes actual para el dashboard
		}
		l := tracking.LlamadoAtencion{
			MatriculaID:             m.ID,
			Fecha:                   s.date(fecha),
			Motivo:                  s.pick(demoMotivosLlamado),
			RepresentanteNotificado: s.r.Intn(5) != 0,
		}
		l.RepresentanteFirmo = l.RepresentanteNotificado && s.r.Intn(4) != 0
		if l.RepresentanteNotificado && !l.RepresentanteFirmo {
			l.MotivoNoFirma = s.pick([]string{"Representante no asistió a la citación", "Representante se negó a firmar"})
		}
		if s.r.Intn(3) == 0 {
			cumplio := s.r.Intn(3) != 0
			sancion := tracking.DetalleSancion{MedidaDisciplinaria: s.pick(medidas), CumplioMedida: cumplio}
			if !cumplio {
				sancion.MotivoIncumplimiento = "No presentó el trabajo formativo asignado"
			}
			l.DetalleSancion = common.JSONMap[tracking.DetalleSancion]{Data: sancion}
		} else {
			l.DetalleSancion = common.JSONMap[tracking.DetalleSancion]{Data: tracking.DetalleSancion{}}
		}
		if err := s.tx.Create(&l).Error; err != nil {
			return err
		}
	}
	return nil
}

func (s *demoSeeder) casos() error {
	estados := []string{"Abierto", "Abierto", "Derivado", "Cerrado"}
	year := s.now.Year()
	for i := 0; i < 14; i++ {
		m := s.matriculaActiva()
		tipo := demoTiposCaso[i%len(demoTiposCaso)]
		if tipo == "Embarazo adolescente" {
			// Buscar una estudiante mujer de 9no/10mo para que el caso sea coherente.
			for m.Estudiante.GeneroNacimiento != "F" || s.nivelEstudiante[m.EstudianteID].Orden < 9 || m.Estado == "Retirado" {
				m = s.listaMatriculas[s.r.Intn(len(s.listaMatriculas))]
			}
			cg := enrollment.CondicionGenero{EstaEmbarazada: true, MesesEmbarazo: 4, LlevaControl: true, TipoApoyoInstitucion: "Flexibilidad de horario y acompañamiento DECE"}
			if err := s.tx.Model(&enrollment.Matricula{}).Where("id = ?", m.ID).
				Update("condicion_genero", common.JSONMap[enrollment.CondicionGenero]{Data: cg}).Error; err != nil {
				return err
			}
		}

		estado := estados[s.r.Intn(len(estados))]
		c := tracking.CasoSensible{
			EstudianteID:    m.EstudianteID,
			PeriodoID:       s.periodoActivo.ID,
			CodigoCaso:      fmt.Sprintf("CASO-%d-%03d", year, i+1),
			TipoCaso:        tipo,
			FechaDeteccion:  s.date(s.diasAtras(1, 140)),
			Descripcion:     fmt.Sprintf("Caso detectado por docente tutor. Se realiza entrevista inicial con el estudiante y se cita al representante. Tipo: %s.", tipo),
			Estado:          estado,
			RutasDocumentos: common.JSONMap[tracking.ListaEvidencias]{Data: tracking.ListaEvidencias{}},
		}
		if estado == "Derivado" || s.r.Intn(2) == 0 {
			c.EntidadDerivacion = s.pick(demoEntidades)
			c.EntidadDerivacionDetalle = "Oficio enviado con número DECE-" + fmt.Sprint(100+i)
		}
		if err := s.tx.Create(&c).Error; err != nil {
			return err
		}
	}
	return nil
}

func (s *demoSeeder) convocatorias() error {
	motivos := []string{
		"Seguimiento de caso de violencia intrafamiliar",
		"Entrevista con representante por bajo rendimiento",
		"Socialización de informe psicopedagógico",
		"Revisión de medidas de protección",
		"Control de embarazo adolescente",
		"Seguimiento por consumo de sustancias",
	}
	for i := 0; i < 14; i++ {
		var fecha time.Time
		completada := false
		if i < 7 {
			fecha = s.diasAtras(1, 60)
			completada = i < 5
		} else {
			fecha = s.now.AddDate(0, 0, 1+s.r.Intn(20)) // futuras, disparan alertas
		}
		fecha = time.Date(fecha.Year(), fecha.Month(), fecha.Day(), 8+s.r.Intn(8), []int{0, 30}[s.r.Intn(2)], 0, 0, time.Local)

		c := management.Convocatoria{
			MatriculaID:    s.matriculaActiva().ID,
			Entidad:        s.pick(append(demoEntidades, "Otros")),
			Motivo:         s.pick(motivos),
			FechaCita:      fecha.Format("2006-01-02 15:04"),
			DiasAlerta:     1 + s.r.Intn(3),
			CitaCompletada: completada,
		}
		if err := s.tx.Create(&c).Error; err != nil {
			return err
		}
	}
	return nil
}

func (s *demoSeeder) capacitaciones() error {
	items := []struct {
		tema, grupo, jornada string
		beneficiarios        int
	}{
		{"Prevención del acoso escolar", "Estudiantes", "", 60},
		{"Escuela para padres: comunicación asertiva", "Padres de Familia", "", 45},
		{"Protocolos de actuación frente a situaciones de violencia", "Docentes", "Ambas", 28},
		{"Prevención del consumo de drogas", "Estudiantes", "", 55},
		{"Educación sexual integral", "Estudiantes", "", 40},
		{"Salud mental y manejo de emociones", "Comunidad", "", 120},
		{"Detección temprana de necesidades educativas especiales", "Docentes", "Matutina", 14},
	}
	for _, it := range items {
		fecha := s.diasAtras(5, 130)
		aud := management.AudienciaCapacitacion{GrupoObjetivo: it.grupo, JornadaDocentes: it.jornada, CantidadBeneficiarios: it.beneficiarios}
		if it.grupo == "Estudiantes" || it.grupo == "Padres de Familia" {
			c1 := s.cursosActivos[12+s.r.Intn(8)]
			c2 := s.cursosActivos[12+s.r.Intn(8)]
			aud.CursoID = c1.ID
			aud.CursosIDs = []uint{c1.ID, c2.ID}
		}
		c := management.Capacitacion{
			PeriodoID:        s.periodoActivo.ID,
			Tema:             it.tema,
			Fecha:            fmt.Sprintf("%s %02d:00", s.date(fecha), 8+s.r.Intn(6)),
			DetalleAudiencia: common.JSONMap[management.AudienciaCapacitacion]{Data: aud},
		}
		if err := s.tx.Create(&c).Error; err != nil {
			return err
		}
	}
	return nil
}
