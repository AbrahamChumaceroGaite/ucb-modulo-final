/**
 * Puerta pública de `recetas`. Solo la vista y los tipos que `app/` necesita.
 *
 * Los casos de uso, la infraestructura y los componentes internos no salen: si
 * otra pantalla los necesitara, la conversación es si ese modelo debe subir a
 * una capa compartida, no abrir la feature entera.
 */
export { RecetaView } from './presentation/receta.view';
