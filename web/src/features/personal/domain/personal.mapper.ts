import { toPatch } from '@/shared/lib/to-patch';
import type { Cliente, CamposDeCliente, ActualizarCliente } from './cliente.schema';
import type { Usuario, CamposDeUsuario, ActualizarUsuario } from './usuario.schema';
import type { Persona } from './persona.schema';

/**
 * Traducción entre lo que manda la API y lo que rellena el formulario.
 *
 * Un solo archivo para usuario y cliente porque **la mitad del trabajo es la
 * misma**: los dos aplanan la misma `persona`. Separarlos obligaría a escribir
 * `aCamposDePersona` dos veces o a inventar un tercer archivo para compartirla.
 *
 * Son funciones puras: se prueban sin montar React ni un servidor.
 */
function aCamposDePersona(persona: Persona) {
  return {
    nombres: persona.nombres,
    apellidos: persona.apellidos,
    // El formulario trabaja con texto: «sin teléfono» es cadena vacía aquí y
    // se convierte a `null` al salir por el cable, en `infrastructure`.
    telefono: persona.telefono ?? '',
    carnet: persona.carnet,
  };
}

/** Usuario → formulario. La contraseña nunca vuelve del servidor: va vacía. */
export function usuarioAFormulario(usuario: Usuario): CamposDeUsuario {
  return {
    ...aCamposDePersona(usuario.persona),
    correo: usuario.correo,
    contrasena: '',
    idRol: usuario.rol.id,
  };
}

export function clienteAFormulario(cliente: Cliente): CamposDeCliente {
  return aCamposDePersona(cliente.persona);
}

/**
 * Formulario → PATCH de usuario. **Solo lo que cambió.**
 *
 * La contraseña en blanco se descarta antes de comparar: en el formulario
 * significa «no la toques», y mandar `""` la borraría. Es la misma distinción
 * que hace `toPatch` entre `undefined` y `null`, aplicada al único campo que
 * no puede volver del servidor para compararse.
 */
export function usuarioAActualizacion(
  original: Usuario,
  valores: CamposDeUsuario,
): ActualizarUsuario {
  const { contrasena, ...resto } = valores;
  const cambios: ActualizarUsuario = toPatch(usuarioAFormulario(original), resto);

  if (contrasena) cambios.contrasena = contrasena;
  return cambios;
}

export function clienteAActualizacion(
  original: Cliente,
  valores: CamposDeCliente,
): ActualizarCliente {
  return toPatch(clienteAFormulario(original), valores);
}
