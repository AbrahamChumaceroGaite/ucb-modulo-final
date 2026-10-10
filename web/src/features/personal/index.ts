/**
 * Puerta pública de `personal`. Solo la pantalla.
 *
 * Ni los casos de uso, ni la infraestructura, ni los formularios salen de
 * aquí. Si otra pantalla necesitara un usuario, la conversación es si ese
 * modelo debe subir a una capa compartida — no abrir la feature entera.
 */
export { PersonalView } from './presentation/personal.view';
