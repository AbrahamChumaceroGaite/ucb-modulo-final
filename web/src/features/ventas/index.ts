/**
 * Puerta pública de `ventas`. Solo la vista.
 *
 * Los casos de uso, la infraestructura y los componentes internos no salen: si
 * otra pantalla los necesitara, la conversación es si ese modelo debe subir a
 * una capa compartida, no abrir la feature entera.
 */
export { VentaView } from './presentation/venta.view';
