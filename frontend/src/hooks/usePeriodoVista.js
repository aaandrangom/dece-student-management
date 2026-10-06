import { useEffect, useState } from 'react';
import { ObtenerPeriodoVista, CambiarPeriodoConsulta } from '../../wailsjs/go/academic/YearService';

// El periodo en vista se carga una sola vez por carga de la app: al cambiar de año se
// recarga la ventana, así todas las pantallas vuelven a pedir sus datos del año elegido.
let cache;
let pending = null;

export const cargarPeriodoVista = () => {
    if (!pending) {
        pending = ObtenerPeriodoVista()
            .then((p) => (cache = p || null))
            .catch(() => {
                pending = null;
                return null;
            });
    }
    return pending;
};

// Cambia el año en consulta (0 = volver al año de trabajo) y recarga la app.
export const cambiarPeriodoVista = async (periodoId) => {
    await CambiarPeriodoConsulta(periodoId);
    window.location.reload();
};

export default function usePeriodoVista() {
    const [periodo, setPeriodo] = useState(cache ?? null);
    const [cargado, setCargado] = useState(cache !== undefined);

    useEffect(() => {
        let alive = true;
        cargarPeriodoVista().then((p) => {
            if (!alive) return;
            setPeriodo(p);
            setCargado(true);
        });
        return () => { alive = false; };
    }, []);

    return {
        periodo,
        cargado,
        // Consulta de otro año o año de trabajo cerrado: no se permiten cambios.
        soloLectura: !!periodo?.solo_lectura,
        esConsulta: !!periodo?.es_consulta,
    };
}
