import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Field } from '../../primitives/fields/field';
import { Input } from '../../primitives/fields/input';
import { FormWizard, ResumenDato, ResumenGrupo, type PasoFormulario } from './form-wizard';

/**
 * La promesa del asistente es que **no se avanza sin validar** y que **no se
 * envía sin haber visto el resumen**. Las dos son afirmaciones sobre
 * comportamiento, así que se comprueban usándolo, no leyéndolo.
 */
const esquema = z.object({
  nombre: z.string().min(2, 'El nombre necesita al menos 2 caracteres'),
  precio: z.number().nonnegative('No puede ser negativo'),
});

type Valores = z.infer<typeof esquema>;

function Asistente({
  onEnviar,
  iniciales = { nombre: '', precio: 0 },
  enviando = false,
}: {
  onEnviar: (valores: Valores) => void;
  iniciales?: Valores;
  enviando?: boolean;
}) {
  const form = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: iniciales,
  });

  const pasos: PasoFormulario<Valores>[] = [
    {
      clave: 'identidad',
      titulo: 'Qué es',
      campos: ['nombre'],
      contenido: (
        <Field etiqueta="Nombre" error={form.formState.errors.nombre?.message}>
          <Input {...form.register('nombre')} />
        </Field>
      ),
    },
    {
      clave: 'precio',
      titulo: 'Cuánto cuesta',
      campos: ['precio'],
      contenido: (
        <Field etiqueta="Precio" error={form.formState.errors.precio?.message}>
          <Input type="number" {...form.register('precio', { valueAsNumber: true })} />
        </Field>
      ),
    },
  ];

  return (
    <FormWizard
      form={form}
      pasos={pasos}
      enviando={enviando}
      onEnviar={onEnviar}
      resumen={(valores) => (
        <ResumenGrupo titulo="Lo que se guarda">
          <ResumenDato etiqueta="Nombre">{valores.nombre}</ResumenDato>
          <ResumenDato etiqueta="Precio">{valores.precio}</ResumenDato>
        </ResumenGrupo>
      )}
    />
  );
}

describe('FormWizard', () => {
  it('no avanza si el campo del paso no es válido, y dice por qué', async () => {
    const usuario = userEvent.setup();
    render(<Asistente onEnviar={vi.fn()} />);

    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El nombre necesita al menos 2 caracteres',
    );
    // Sigue en el primer paso: su campo continúa en pantalla.
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.queryByLabelText('Precio')).not.toBeInTheDocument();
  });

  it('avanza cuando el campo del paso es válido', async () => {
    const usuario = userEvent.setup();
    render(<Asistente onEnviar={vi.fn()} />);

    await usuario.type(screen.getByLabelText('Nombre'), 'House Espresso');
    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByLabelText('Precio')).toBeInTheDocument();
  });

  it('el resumen enseña lo tecleado y solo desde ahí se envía', async () => {
    const usuario = userEvent.setup();
    const enviar = vi.fn();
    render(<Asistente onEnviar={enviar} />);

    await usuario.type(screen.getByLabelText('Nombre'), 'House Espresso');
    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }));

    await usuario.clear(await screen.findByLabelText('Precio'));
    await usuario.type(screen.getByLabelText('Precio'), '92');
    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }));

    // En el resumen: ya no hay «Siguiente», hay «Guardar», y se ve el dato.
    const guardar = await screen.findByRole('button', { name: 'Guardar' });
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();
    expect(screen.getByText('House Espresso')).toBeInTheDocument();
    expect(enviar).not.toHaveBeenCalled();

    await usuario.click(guardar);
    // Un solo argumento: los valores. No hay evento porque no hay envío
    // nativo — guardar es una llamada, no una activación del formulario.
    expect(enviar).toHaveBeenCalledTimes(1);
    expect(enviar.mock.calls[0]?.[0]).toMatchObject({
      nombre: 'House Espresso',
      precio: 92,
    });
  });

  it('Enter en un campo NO envía el formulario desde un paso intermedio', async () => {
    const usuario = userEvent.setup();
    const enviar = vi.fn();

    // Valores ya válidos, como al editar: es el caso en el que el envío
    // implícito del navegador se saltaba la revisión entera.
    render(<Asistente onEnviar={enviar} iniciales={{ nombre: 'House Espresso', precio: 92 }} />);

    await usuario.click(screen.getByLabelText('Nombre'));
    await usuario.keyboard('{Enter}');

    expect(enviar).not.toHaveBeenCalled();
    // Y sigue en el primer paso, no ha saltado a ningún sitio.
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
  });

  it('mientras se guarda no se puede navegar a otro paso', () => {
    render(
      <Asistente onEnviar={vi.fn()} iniciales={{ nombre: 'House Espresso', precio: 92 }} enviando />,
    );

    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    // Los pasos del indicador tampoco: saltar a mitad de una petición deja la
    // pantalla diciendo una cosa y el servidor otra.
    expect(screen.getByRole('button', { name: /Qué es/ })).toBeDisabled();
  });

  it('el botón de envío enseña los puntos, no su texto, mientras guarda', () => {
    render(<AsistenteEnRevision onEnviar={vi.fn()} enviando />);

    expect(screen.getByRole('status', { name: 'Guardando' })).toBeInTheDocument();
    expect(screen.queryByText('Guardar')).not.toBeInTheDocument();
  });

  it('un envío nativo del formulario no guarda nada, venga de donde venga', () => {
    const enviar = vi.fn();
    render(<Asistente onEnviar={enviar} iniciales={{ nombre: 'House Espresso', precio: 92 }} />);

    const formulario = screen.getByRole('button', { name: 'Siguiente' }).closest('form');
    fireEvent.submit(formulario as HTMLFormElement);

    expect(enviar).not.toHaveBeenCalled();
  });

  it('ni siquiera desde la revisión: guardar es una llamada explícita', () => {
    const enviar = vi.fn();
    render(<AsistenteEnRevision onEnviar={enviar} />);

    const formulario = screen.getByRole('button', { name: 'Guardar' }).closest('form');
    fireEvent.submit(formulario as HTMLFormElement);

    expect(enviar).not.toHaveBeenCalled();
  });

  it('ningún botón del asistente puede enviar el formulario por activación', () => {
    render(<Asistente onEnviar={vi.fn()} iniciales={{ nombre: 'House Espresso', precio: 92 }} />);

    const formulario = screen.getByRole('button', { name: 'Siguiente' }).closest('form');
    const deEnvio = formulario?.querySelectorAll('button[type="submit"], button:not([type])');

    // Un `<button>` sin `type` es `submit` por defecto: contarlos a los dos.
    expect(deEnvio).toHaveLength(0);
  });

  it('se puede volver a un paso ya completado y lo tecleado sigue ahí', async () => {
    const usuario = userEvent.setup();
    render(<Asistente onEnviar={vi.fn()} />);

    await usuario.type(screen.getByLabelText('Nombre'), 'House Espresso');
    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }));
    await usuario.click(await screen.findByRole('button', { name: 'Atrás' }));

    expect(screen.getByLabelText('Nombre')).toHaveValue('House Espresso');
  });
});

/**
 * Un asistente de un solo paso: así la revisión es el paso 1 y se puede mirar
 * el botón de envío sin recorrer el formulario entero.
 */
function AsistenteEnRevision({
  onEnviar,
  enviando = false,
}: {
  onEnviar: (valores: Valores) => void;
  enviando?: boolean;
}) {
  const form = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: { nombre: 'House Espresso', precio: 92 },
  });

  return (
    <FormWizard
      form={form}
      pasos={[]}
      enviando={enviando}
      onEnviar={onEnviar}
      resumen={(valores) => <p>{valores.nombre}</p>}
    />
  );
}
