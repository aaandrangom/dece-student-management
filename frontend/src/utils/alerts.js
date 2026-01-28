import Swal from 'sweetalert2';

export const confirmAction = async ({
  title = '¿Estás seguro?',
  text = "Esta acción no se puede deshacer",
  confirmButtonText = 'Sí, continuar',
  cancelButtonText = 'Cancelar',
  icon = 'warning',
  confirmButtonColor = '#7c3aed',
  cancelButtonColor = '#64748b',
}) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor,
    cancelButtonColor,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    customClass: {
      popup: 'rounded-2xl font-sans',
      confirmButton: 'px-4 py-2 rounded-xl text-sm font-medium shadow-sm',
      cancelButton: 'px-4 py-2 rounded-xl text-sm font-medium'
    }
  });

  return result.isConfirmed;
};

export const showAlert = ({
  title,
  text,
  icon = 'success',
  confirmButtonColor = '#7c3aed'
}) => {
  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonColor,
    customClass: {
      popup: 'rounded-2xl font-sans',
      confirmButton: 'px-4 py-2 rounded-xl text-sm font-medium shadow-sm'
    }
  });
};
