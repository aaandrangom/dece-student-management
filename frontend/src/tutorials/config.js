import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export const createDriver = (steps, onFinish) => {
    return driver({
        showProgress: true,
        steps: steps,
        animate: true,
        allowClose: true,
        overlayColor: 'rgb(27 38 54 / 0.8)', // Color de fondo del overlay (slate-900 con opacidad)
        doneBtnText: 'Finalizar',
        closeBtnText: 'Cerrar',
        nextBtnText: 'Siguiente',
        prevBtnText: 'Anterior',
        onDestroyStarted: () => {
            if (onFinish) onFinish();
            driver.destroy();
        },
        popoverClass: 'driverjs-theme', // Para estilos personalizados si se necesitan
    });
};
