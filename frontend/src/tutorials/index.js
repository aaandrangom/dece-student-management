
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import Swal from 'sweetalert2';

// Importar definiciones de pasos
import { getInitialConfigSteps } from './steps/initialConfig';

/**
 * Configuración global del driver
 */
const driverConfig = {
    showProgress: true,
    animate: true,
    allowClose: false, // Evitar cierre accidental clickeando fuera
    overlayColor: 'rgba(15, 23, 42, 0.9)', // slate-900 más oscuro
    popoverClass: 'driverjs-theme-custom',
    nextBtnText: 'Siguiente →',
    prevBtnText: '← Anterior',
    doneBtnText: '¡Entendido!',
    progressText: 'Paso {{current}} de {{total}}',
};

/**
 * Mapeo de tutoriales disponibles
 * @param {Function} navigate - Función navigate de react-router-dom
 * @param {Object} driverObj - Instancia del driver
 * @returns {Object} - Objeto con claves de tutoriales y valores (array de pasos)
 */
export const getTutorialSteps = (navigate, driverObj) => ({
    'initial-config': getInitialConfigSteps(navigate, driverObj),
});

/**
 * Inicia un tutorial específico
 * @param {string} tutorialId - ID del tutorial a iniciar
 * @param {Function} navigate - Función navigate de react-router-dom
 * @param {Function} onComplete - Callback al finalizar
 */
export const startTutorial = (tutorialId, navigate, onComplete) => {
    // 1. Crear instancia del driver sin pasos iniciales
    const driverObj = driver({
        ...driverConfig,
        // Interceptar el cierre manual (X)
        onCloseClick: () => {
            driverObj.destroy();
        },
        // Hook de destrucción: se llama ANTES de destruir
        onDestroyStarted: () => {
            if (!driverObj.hasNextStep() || driverObj.isLastStep()) {
                driverObj.destroy();
                if (onComplete) onComplete();
                return;
            }

            Swal.fire({
                title: '¿Salir del tutorial?',
                text: "El progreso actual se perderá.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Sí, salir',
                cancelButtonText: 'Continuar',
                reverseButtons: true,
                customClass: {
                    container: 'swal2-z-index-override'
                },
                didOpen: () => {
                    const container = Swal.getContainer();
                    if (container) container.style.zIndex = '99999999';
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    driverObj.destroy();
                    if (onComplete) onComplete();
                }
            });
        },
    });

    // 2. Obtener los pasos pasándole la instancia del driver
    const allSteps = getTutorialSteps(navigate, driverObj);
    const steps = allSteps[tutorialId];

    if (!steps) {
        console.warn(`Tutorial '${tutorialId}' no encontrado.`);
        if (onComplete) onComplete();
        return;
    }

    // 3. Asignar pasos y arrancar
    driverObj.setConfig({
        ...driverConfig, // Re-mergear config por si acaso setConfig reemplaza todo
        steps: steps,
        onCloseClick: () => { driverObj.destroy(); }, // Re-declarar callbacks necesarios
        onDestroyStarted: () => {
            // Replicar lógica destruction (lamentablemente setConfig suele requerir re-definir)
            if (!driverObj.hasNextStep() || driverObj.isLastStep()) {
                driverObj.destroy();
                if (onComplete) onComplete();
                return;
            }

            Swal.fire({
                title: '¿Salir del tutorial?',
                text: "El progreso actual se perderá.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Sí, salir',
                cancelButtonText: 'Continuar',
                reverseButtons: true,
                customClass: {
                    container: 'swal2-z-index-override'
                },
                didOpen: () => {
                    const container = Swal.getContainer();
                    if (container) container.style.zIndex = '99999999';
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    driverObj.destroy();
                    if (onComplete) onComplete();
                }
            });
        }
    });

    driverObj.drive();
    return driverObj;
};
