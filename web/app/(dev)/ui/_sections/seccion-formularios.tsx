'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { FormField, FormLayout, FormRow } from '@/shared/ui/patterns';
import { Muestra, Seccion } from '../_components/showcase';
import { FormularioInsumo } from '../_components/formulario-insumo';
import type { ValoresInsumo } from '../_components/formulario-insumo.schema';

/**
 * Formularios: composición por tramos, validación por esquema y pasos.
 *
 * ## Por qué no hay motor de formularios
 *
 * Un esquema Zod describe la forma **y** los mensajes; React Hook Form lo
 * aplica. Escribir un motor propio para generar campos desde una configuración
 * sería reimplementar una librería madura: el proyecto Angular que auditamos
 * tuvo que hacerlo porque Angular no tiene este ecosistema.
 *
 * ## Por qué tramos y no una rejilla de 12
 *
 * Cada campo declara cuánto ocupa y la fila envuelve sola. No hay un
 * `grid-cols-2 md:grid-cols-4` repetido en cada pantalla ni breakpoints
 * escritos a mano.
 */
export function SeccionFormularios() {
  const [guardando, setGuardando] = useState(false);

  const enviar = (valores: ValoresInsumo) => {
    setGuardando(true);
    // Simula la ida y vuelta al servidor para que se vean los puntos del botón
    // y el bloqueo de «Atrás» mientras se guarda.
    setTimeout(() => {
      setGuardando(false);
      toast.success(`«${valores.nombre}» entró a la despensa`);
    }, 1200);
  };

  return (
    <Seccion
      id="formularios"
      titulo="Formularios"
      descripcion="El mismo esquema valida el formulario y describe lo que la API acepta. El mensaje viaja pegado a la regla."
    >
      <Muestra
        titulo="Alta de insumo, por pasos"
        nota="Pulsa «Siguiente» con los campos vacíos: no avanza, y solo se marcan los campos de ESE paso. El último enseña lo que se va a guardar; es el único sitio desde el que se envía. Este mismo formulario es el que se abre al editar desde una tarjeta."
        className="block"
      >
        <FormularioInsumo guardando={guardando} onGuardar={enviar} />
      </Muestra>

      <Muestra
        titulo="Tramos"
        nota="Cada campo dice cuánto ocupa. Estrecha la ventana y mira cómo envuelven."
        className="block"
      >
        <FormLayout>
          <FormRow>
            <FormField tramo="completo">
              <div className="rounded-sm bg-primary-container p-2 text-center text-xs text-on-primary-container">
                completo
              </div>
            </FormField>
          </FormRow>
          <FormRow>
            {(['mitad', 'mitad'] as const).map((tramo, indice) => (
              <FormField key={indice} tramo={tramo}>
                <div className="rounded-sm bg-secondary-container p-2 text-center text-xs text-on-secondary-container">
                  {tramo}
                </div>
              </FormField>
            ))}
          </FormRow>
          <FormRow>
            {(['tercio', 'tercio', 'tercio'] as const).map((tramo, indice) => (
              <FormField key={indice} tramo={tramo} minimo="8rem">
                <div className="rounded-sm bg-surface-container-highest p-2 text-center text-xs text-on-surface">
                  {tramo}
                </div>
              </FormField>
            ))}
          </FormRow>
          <FormRow>
            {(['cuarto', 'cuarto', 'cuarto', 'cuarto'] as const).map((tramo, indice) => (
              <FormField key={indice} tramo={tramo} minimo="7rem">
                <div className="rounded-sm bg-surface-container-high p-2 text-center text-xs text-on-surface">
                  {tramo}
                </div>
              </FormField>
            ))}
          </FormRow>
        </FormLayout>
      </Muestra>
    </Seccion>
  );
}
