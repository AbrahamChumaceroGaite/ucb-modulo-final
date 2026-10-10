import { z } from 'zod';
import { RUTAS } from '@/shared/config/routes';

/**
 * Perfil de acceso: con qué sombrero entra alguien al panel.
 *
 * ## Qué es y qué NO es
 *
 * **No es** un permiso. `POST /auth/login` solo acepta correo y contraseña
 * —comprobado en `AutenticacionController`—, así que elegir aquí
 * «Administrador» no da ni quita nada: quien manda es el rol que el servidor
 * escribe en el token, y cada endpoint lo comprueba de su lado.
 *
 * **Sí es** una preferencia de destino: dice en qué pantalla quieres caer.
 * Quien abre la cafetería a las seis quiere la despensa; quien administra
 * quiere el equipo. Y sirve para avisar cuando lo elegido y el rol real no
 * coinciden, en vez de dejar a alguien preguntándose por qué no ve lo suyo.
 */
export const PERFILES = [
  {
    valor: 'administrador',
    etiqueta: 'Administrador',
    queHace: 'Cuentas del equipo, precios y altas.',
    entra: RUTAS.panel.usuarios,
  },
  {
    valor: 'operador',
    etiqueta: 'Operador',
    queHace: 'Barra, despensa y lo que se va gastando.',
    entra: RUTAS.panel.productos,
  },
] as const;

export const perfilSchema = z.enum(['administrador', 'operador']);
export type Perfil = z.infer<typeof perfilSchema>;

export const PERFIL_POR_DEFECTO: Perfil = 'operador';

export function definicionDePerfil(perfil: Perfil) {
  // El `!` no aparece: `find` sobre una tupla literal que contiene ambos
  // valores del enum siempre encuentra, pero TypeScript no puede saberlo, así
  // que se cae al primero en vez de mentirle al compilador.
  return PERFILES.find((definicion) => definicion.valor === perfil) ?? PERFILES[0];
}

/**
 * Traduce el nombre de rol que devuelve el backend a uno de nuestros perfiles.
 *
 * La tabla `rol` de `databasev4.sql` no trae filas sembradas: `nombre` es un
 * `VARCHAR(50)` que alguien escribe a mano. Por eso esto reconoce por palabra
 * y **devuelve `null` cuando no reconoce nada**, en lugar de adivinar. Con
 * `null` no se avisa de ninguna discrepancia: no hay base para afirmarla.
 */
export function perfilDeRol(rolNombre: string): Perfil | null {
  const normalizado = rolNombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

  if (/admin|gerent|encargad|due[nñ]/.test(normalizado)) return 'administrador';
  if (/opera|barist|cajer|mesero|vendedor/.test(normalizado)) return 'operador';
  return null;
}
