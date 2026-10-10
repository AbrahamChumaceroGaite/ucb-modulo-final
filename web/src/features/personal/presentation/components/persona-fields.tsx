'use client';

import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { IdCard, Phone, User } from 'lucide-react';
import { Field, Input } from '@/shared/ui/primitives';
import { FormField, FormLayout, FormRow } from '@/shared/ui/patterns';
import type { CamposDePersona } from '../../domain/persona.schema';

/**
 * Los cuatro campos que comparten el alta de usuario y la de cliente.
 *
 * En el backend son literalmente los mismos: `CrearUsuarioRequest` y
 * `CrearClienteRequest` repiten `nombres`, `apellidos`, `telefono` y `carnet`.
 * Aquí se escriben **una vez** y los dos formularios los insertan en su paso
 * de identidad.
 *
 * ## Por qué recibe `register` y `errores` en vez de crear su propio formulario
 *
 * Porque no es un formulario, es un trozo de uno. El `useForm` vive en el
 * formulario que lo usa, así que estos campos participan de su validación, de
 * su PATCH y de su paso — sin un estado paralelo que sincronizar.
 *
 * El genérico está acotado a `CamposDePersona`: cualquier formulario que los
 * incluya vale, y uno que no los tenga no compila.
 */
export function PersonaFields<T extends CamposDePersona>({
  register,
  errores,
}: {
  register: UseFormRegister<T>;
  errores: FieldErrors<T>;
}) {
  // El cast es el precio de que React Hook Form indexe por rutas literales:
  // `T` extiende la forma, así que estos cuatro nombres existen seguro, pero
  // el tipo genérico no lo sabe. Está acotado aquí y no se propaga.
  const campo = (nombre: keyof CamposDePersona) => register(nombre as never);
  const error = (nombre: keyof CamposDePersona) =>
    (errores as FieldErrors<CamposDePersona>)[nombre]?.message;

  return (
    <FormLayout>
      <FormRow>
        <FormField tramo="mitad">
          <Field etiqueta="Nombres" requerido error={error('nombres')}>
            <Input
              placeholder="Luis Fernando"
              iconoInicio={<User className="size-4" />}
              {...campo('nombres')}
            />
          </Field>
        </FormField>

        <FormField tramo="mitad">
          <Field etiqueta="Apellidos" requerido error={error('apellidos')}>
            <Input placeholder="Chavez Pereira" {...campo('apellidos')} />
          </Field>
        </FormField>
      </FormRow>

      <FormRow>
        <FormField tramo="mitad">
          <Field
            etiqueta="Carnet"
            requerido
            error={error('carnet')}
            ayuda="Solo números, sin guiones ni complemento"
          >
            <Input
              soloDigitos
              placeholder="83726352"
              iconoInicio={<IdCard className="size-4" />}
              {...campo('carnet')}
            />
          </Field>
        </FormField>

        <FormField tramo="mitad">
          <Field
            etiqueta="Teléfono"
            error={error('telefono')}
            ayuda="Opcional. Ocho dígitos, empieza por 6 o 7"
          >
            <Input
              soloDigitos
              maxLength={8}
              placeholder="67253582"
              iconoInicio={<Phone className="size-4" />}
              {...campo('telefono')}
            />
          </Field>
        </FormField>
      </FormRow>
    </FormLayout>
  );
}
