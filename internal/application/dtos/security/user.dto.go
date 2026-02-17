package dtos

// FechaCreacion como string RFC3339 para bindings

type UsuarioResponseDTO struct {
	ID             uint   `json:"id"`
	NombreUsuario  string `json:"nombre_usuario"`
	NombreCompleto string `json:"nombre_completo"`
	Rol            string `json:"rol"`
	Activo         bool   `json:"activo"`
	FechaCreacion  string `json:"fecha_creacion"`
	Cargo          string `json:"cargo"`
	FotoPerfil     string `json:"foto_perfil"`
}

type CrearUsuarioDTO struct {
	NombreUsuario  string `json:"nombre_usuario"`
	Clave          string `json:"clave"`
	NombreCompleto string `json:"nombre_completo"`
	Rol            string `json:"rol"`
}

type ActualizarUsuarioDTO struct {
	ID             uint   `json:"id"`
	NombreCompleto string `json:"nombre_completo"`
	Rol            string `json:"rol"`
	Activo         bool   `json:"activo"`
}
