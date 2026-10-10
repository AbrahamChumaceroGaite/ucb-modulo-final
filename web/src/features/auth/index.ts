/**
 * Puerta pública de `auth`. Solo lo que `app/` necesita.
 *
 * Los hooks internos, la infraestructura y las cookies no se exportan: son
 * asunto de la feature. Este barril no se importa desde dentro de `auth/`,
 * para que no pueda cerrar un ciclo.
 */
export { LoginForm } from './presentation/components/login-form';
export { PanelSession } from './presentation/components/panel-session';
export { leerUsuario as leerUsuarioDeSesion } from './server/sesion.server';
export type { UsuarioAutenticado } from './domain/sesion.schema';
