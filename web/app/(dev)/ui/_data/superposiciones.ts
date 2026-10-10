/** Recorrido guiado de ejemplo del escaparate. */

export const PASOS_DEMO = [
  {
    elemento: '[data-tour="demo-dialogo"]',
    titulo: 'Los diálogos interrumpen',
    descripcion: 'Se usan cuando hace falta una decisión antes de seguir.',
    lado: 'bottom' as const,
  },
  {
    elemento: '[data-tour="demo-panel"]',
    titulo: 'Los paneles acompañan',
    descripcion: 'Para ver un registro sin perder de vista el listado que hay detrás.',
    lado: 'bottom' as const,
  },
];
