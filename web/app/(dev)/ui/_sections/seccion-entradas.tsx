'use client';

import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Coffee, Hash, Mail } from 'lucide-react';
import {
  Checkbox,
  DatePicker,
  DateRangePicker,
  Field,
  Input,
  SearchInput,
  SegmentedControl,
  Select,
  Switch,
  Textarea,
} from '@/shared/ui/primitives';
import { FormField, FormRow } from '@/shared/ui/patterns';
import { Muestra, Seccion } from '../_components/showcase';
import { UNIDADES } from '../_data/entradas';

export function SeccionEntradas() {
  const [busqueda, setBusqueda] = useState('');
  const [fecha, setFecha] = useState<Date | null>(null);
  const [rango, setRango] = useState<DateRange | undefined>();
  const [vendible, setVendible] = useState(true);
  const [marcado, setMarcado] = useState(false);
  const [turno, setTurno] = useState('manana');

  return (
    <Seccion
      id="entradas"
      titulo="Entradas"
      descripcion="Cada control se envuelve en un campo que aporta etiqueta, ayuda y error. La etiqueta queda asociada al control sin que nadie invente un id."
    >
      <Muestra titulo="Texto" className="block">
        <FormRow>
          <FormField tramo="mitad">
            <Field etiqueta="Nombre del insumo" requerido ayuda="Como aparece en la carta">
              <Input placeholder="House Espresso" iconoInicio={<Coffee className="size-4" />} />
            </Field>
          </FormField>

          <FormField tramo="mitad">
            <Field etiqueta="Correo" error="Ese correo ya tiene cuenta">
              <Input type="email" defaultValue="marcus@kaffehaus.bo" iconoInicio={<Mail className="size-4" />} />
            </Field>
          </FormField>
        </FormRow>

        <FormRow className="mt-4">
          <FormField tramo="tercio">
            <Field etiqueta="Contraseña" ayuda="El ojo se alcanza con el teclado">
              <Input type="password" defaultValue="tostado2026" />
            </Field>
          </FormField>

          <FormField tramo="tercio">
            <Field etiqueta="Stock" ayuda="Admite decimales">
              <Input type="number" step="0.01" defaultValue="2.5" iconoInicio={<Hash className="size-4" />} />
            </Field>
          </FormField>

          <FormField tramo="tercio">
            <Field etiqueta="Unidad" requerido>
              <Select opciones={UNIDADES} marcador="Elegir…" defaultValue="kg" />
            </Field>
          </FormField>
        </FormRow>

        <FormRow className="mt-4">
          <FormField>
            <Field etiqueta="Notas de la receta" ayuda="Lo que el barista necesita saber">
              <Textarea
                rows={3}
                defaultValue="Doble carga, leche texturizada a 60 °C. Sirve en taza de 200 ml."
              />
            </Field>
          </FormField>
        </FormRow>
      </Muestra>

      <Muestra titulo="Desactivado" nota="Se ve que existe, se ve que no se puede tocar.">
        <div className="w-64">
          <Field etiqueta="Código interno" ayuda="Lo asigna el sistema">
            <Input disabled defaultValue="INS-0041" />
          </Field>
        </div>
      </Muestra>

      <Muestra titulo="Buscador" nota="Emite 300 ms después de la última tecla. Enter no espera.">
        <div className="w-full max-w-sm">
          <SearchInput valor={busqueda} onBuscar={setBusqueda} marcador="Buscar insumo…" />
        </div>
        <span className="text-xs text-on-surface-variant">
          {busqueda ? `Buscando: «${busqueda}»` : 'Escribe para ver cómo emite'}
        </span>
      </Muestra>

      <Muestra titulo="Marcas" nota="El interruptor es para lo que surte efecto al momento; la casilla, para lo que se confirma al guardar.">
        <Checkbox
          etiqueta="Incluir dados de baja"
          checked={marcado}
          onChange={(evento) => setMarcado(evento.target.checked)}
        />
        <Checkbox etiqueta="Parcial (indeterminada)" indeterminado checked={false} readOnly />
        <Switch
          etiqueta="Se vende en la barra"
          checked={vendible}
          onChange={(evento) => setVendible(evento.target.checked)}
        />
        <Checkbox etiqueta="Bloqueada" disabled checked readOnly />
      </Muestra>

      <Muestra
        titulo="Segmentado"
        nota="Son radios de verdad: se cambia de opción con las flechas y el grupo se anuncia entero. Por encima de tres opciones, Select. El alternador de vistas de la sección Tarjetas es este mismo componente con iconos: aquí no se repite."
        className="block"
      >
        <div className="max-w-sm">
          <SegmentedControl
            medida="sm"
            etiquetaGrupo="Turno"
            valor={turno}
            onCambiar={setTurno}
            opciones={[
              { valor: 'manana', etiqueta: 'Mañana' },
              { valor: 'tarde', etiqueta: 'Tarde' },
              { valor: 'cierre', etiqueta: 'Cierre' },
            ]}
          />
        </div>

        <p className="mt-3 text-xs text-on-surface-variant">
          Turno de {turno === 'manana' ? 'mañana' : turno}
        </p>
      </Muestra>

      <Muestra titulo="Fechas" nota="El intervalo no se aplica al vuelo: elegirlo pasa por estados a medias.">
        <div className="w-56">
          <DatePicker valor={fecha} onCambiar={setFecha} marcador="Fecha de compra" maxima={new Date()} />
        </div>
        <DateRangePicker valor={rango} onCambiar={setRango} maxima={new Date()} />
      </Muestra>
    </Seccion>
  );
}
