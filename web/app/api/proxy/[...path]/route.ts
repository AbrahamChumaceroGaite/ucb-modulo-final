/**
 * Proxy autenticado. La ruta solo enruta: los cuatro verbos del contrato
 * apuntan al mismo handler, que es quien añade la cabecera de sesión.
 */
import { manejarProxy } from '@/features/auth/server/proxy.handlers';

export { manejarProxy as GET, manejarProxy as POST, manejarProxy as PATCH, manejarProxy as DELETE };
