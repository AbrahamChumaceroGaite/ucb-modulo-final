'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AtSign, KeyRound, ShieldCheck } from 'lucide-react';
import { ChoiceGroup, Field, Input, Tag } from '@/shared/ui/primitives';
import {
  FormField,
  FormLayout,
  FormRow,
  FormWizard,
  ResumenDato,
  ResumenGrupo,
  type PasoFormulario,
} from '@/shared/ui/patterns';
import { ROLES, ROL_POR_DEFECTO, rolPorId } from '@/shared/config/roles';
import {
  camposDeUsuarioSchema,
  crearUsuarioSchema,
  type CamposDeUsuario,
  type Usuario,
} from '../../domain/usuario.schema';
import { usuarioAFormulario } from '../../domain/personal.mapper';
import { PersonaFields } from './persona-fields';

/**
 * Alta y edición de una cuenta, por pasos.
 *
 * ## Un formulario, dos operaciones
 *
 * Si llega `usuario`, arranca con sus valores y el último botón dice «Guardar
 * cambios». Es el mismo criterio de todo el proyecto: dos formularios casi
 * iguales acaban divergiendo en el campo que alguien añadió solo en uno.
 *
 * ## La contraseña es lo único que cambia entre los dos
 *
 * En un alta es obligatoria; al editar, en blanco significa «no la toques» y
 * `usuarioAActualizacion` la descarta antes de comparar. Por eso hay **dos
 * esquemas y no dos formularios**: `crearUsuarioSchema` exige contraseña y
 * `camposDeUsuarioSchema` la admite vacía. El resto es idéntico.
 *
 * ## El rol no es un desplegable
 *
 * Son dos opciones y cada una decide lo que esa persona podrá hacer. Un
 * `<select>` las escondería y, sobre todo, no tiene sitio para explicarlas.
 */
export function UsuarioForm({
  usuario,
  guardando,
  onGuardar,
  onCancelar,
}: {
  usuario?: Usuario;
  guardando: boolean;
  onGuardar: (valores: CamposDeUsuario) => void;
  onCancelar: () => void;
}) {
  const editando = usuario !== undefined;

  const form = useForm<CamposDeUsuario>({
    resolver: zodResolver(editando ? camposDeUsuarioSchema : crearUsuarioSchema),
    defaultValues: usuario
      ? usuarioAFormulario(usuario)
      : {
          nombres: '',
          apellidos: '',
          telefono: '',
          carnet: '',
          correo: '',
          contrasena: '',
          idRol: ROL_POR_DEFECTO,
        },
  });

  const errores = form.formState.errors;

  const pasos: PasoFormulario<CamposDeUsuario>[] = [
    {
      clave: 'identidad',
      titulo: 'Quién es',
      campos: ['nombres', 'apellidos', 'carnet', 'telefono'],
      contenido: <PersonaFields register={form.register} errores={errores} />,
    },
    {
      clave: 'acceso',
      titulo: 'Cómo entra',
      campos: ['correo', 'contrasena'],
      contenido: (
        <FormLayout>
          <FormRow>
            <FormField>
              <Field etiqueta="Correo" requerido error={errores.correo?.message}>
                <Input
                  type="email"
                  autoComplete="off"
                  placeholder="nombre@kaffehaus.bo"
                  iconoInicio={<AtSign className="size-4" />}
                  {...form.register('correo')}
                />
              </Field>
            </FormField>
          </FormRow>

          <FormRow>
            <FormField>
              <Field
                etiqueta="Contraseña"
                requerido={!editando}
                error={errores.contrasena?.message}
                ayuda={
                  editando
                    ? 'Déjala en blanco para no cambiarla'
                    : 'Mínimo 8 caracteres. Se la tendrás que dar en persona'
                }
              >
                <Input
                  type="password"
                  autoComplete="new-password"
                  iconoInicio={<KeyRound className="size-4" />}
                  {...form.register('contrasena')}
                />
              </Field>
            </FormField>
          </FormRow>
        </FormLayout>
      ),
    },
    {
      clave: 'rol',
      titulo: 'Qué puede hacer',
      campos: ['idRol'],
      contenido: (
        <Controller
          control={form.control}
          name="idRol"
          render={({ field }) => (
            <Field etiqueta="Rol" requerido error={errores.idRol?.message}>
              <ChoiceGroup
                etiquetaGrupo="Rol de la cuenta"
                seleccion={[field.value]}
                onCambiar={([elegido]) => field.onChange(elegido)}
                opciones={ROLES.map((rol) => ({
                  valor: rol.id,
                  etiqueta: rol.nombre,
                  detalle: rol.queHace,
                  icono: <ShieldCheck className="size-4 text-primary" aria-hidden />,
                }))}
              />
            </Field>
          )}
        />
      ),
    },
  ];

  return (
    <FormWizard
      form={form}
      pasos={pasos}
      enviando={guardando}
      onEnviar={onGuardar}
      onCancelar={onCancelar}
      textoEnviar={editando ? 'Guardar cambios' : 'Crear la cuenta'}
      resumen={(valores) => (
        <div className="flex flex-col gap-3">
          <ResumenGrupo titulo="Quién es">
            <ResumenDato etiqueta="Nombre">
              {`${valores.nombres} ${valores.apellidos}`.trim()}
            </ResumenDato>
            <ResumenDato etiqueta="Carnet">{valores.carnet}</ResumenDato>
            <ResumenDato etiqueta="Teléfono">{valores.telefono}</ResumenDato>
          </ResumenGrupo>

          <ResumenGrupo titulo="Cómo entra">
            <ResumenDato etiqueta="Correo">{valores.correo}</ResumenDato>
            <ResumenDato etiqueta="Contraseña">
              {valores.contrasena ? (
                'Se establece ahora'
              ) : (
                <span className="text-on-surface-variant">Sin cambios</span>
              )}
            </ResumenDato>
          </ResumenGrupo>

          <ResumenGrupo titulo="Qué puede hacer">
            <ResumenDato etiqueta="Rol">
              <Tag tono="primary">{rolPorId(valores.idRol)?.nombre ?? 'Sin rol'}</Tag>
            </ResumenDato>
          </ResumenGrupo>
        </div>
      )}
    />
  );
}
