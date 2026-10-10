'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FormWizard,
  ResumenDato,
  ResumenGrupo,
  type PasoFormulario,
} from '@/shared/ui/patterns';
import {
  camposDeClienteSchema,
  type CamposDeCliente,
  type Cliente,
} from '../../domain/cliente.schema';
import { clienteAFormulario } from '../../domain/personal.mapper';
import { PersonaFields } from './persona-fields';

/**
 * Alta y edición de un cliente.
 *
 * Un solo paso, porque un cliente **es** una persona y nada más: no tiene
 * correo, ni contraseña, ni rol. El asistente se usa igual para que la
 * revisión final —«esto es lo que se va a guardar»— sea la misma en las dos
 * pantallas; un formulario que se envía sin revisar y otro que no sería una
 * incoherencia difícil de explicar.
 *
 * Los campos salen de `<PersonaFields>`, los mismos que el formulario de
 * usuario. Si mañana la persona gana un campo, aparece en los dos a la vez.
 */
export function ClienteForm({
  cliente,
  guardando,
  onGuardar,
  onCancelar,
}: {
  cliente?: Cliente;
  guardando: boolean;
  onGuardar: (valores: CamposDeCliente) => void;
  onCancelar: () => void;
}) {
  const form = useForm<CamposDeCliente>({
    resolver: zodResolver(camposDeClienteSchema),
    defaultValues: cliente
      ? clienteAFormulario(cliente)
      : { nombres: '', apellidos: '', telefono: '', carnet: '' },
  });

  const pasos: PasoFormulario<CamposDeCliente>[] = [
    {
      clave: 'identidad',
      titulo: 'Quién es',
      campos: ['nombres', 'apellidos', 'carnet', 'telefono'],
      contenido: <PersonaFields register={form.register} errores={form.formState.errors} />,
    },
  ];

  return (
    <FormWizard
      form={form}
      pasos={pasos}
      enviando={guardando}
      onEnviar={onGuardar}
      onCancelar={onCancelar}
      textoEnviar={cliente ? 'Guardar cambios' : 'Añadir a la libreta'}
      resumen={(valores) => (
        <ResumenGrupo titulo="Quién es">
          <ResumenDato etiqueta="Nombre">
            {`${valores.nombres} ${valores.apellidos}`.trim()}
          </ResumenDato>
          <ResumenDato etiqueta="Carnet">{valores.carnet}</ResumenDato>
          <ResumenDato etiqueta="Teléfono">{valores.telefono}</ResumenDato>
        </ResumenGrupo>
      )}
    />
  );
}
