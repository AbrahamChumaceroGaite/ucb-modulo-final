'use client';

import type { ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/shared/lib/cn';
import { COLORES_SERIE, EJE, ESTILO_TOOLTIP } from './chart.data';

/**
 * Gráficos del sistema.
 *
 * ## Una sola paleta, aquí
 *
 * Las series toman su color de los tokens del tema, no de una paleta propia de
 * la librería. Auditamos un proyecto cuyos gráficos usaban 34 variables CSS que
 * no existían —`--p-purple-500` con 46 usos, entre otras—, así que media paleta
 * no pintaba nada.
 *
 * ## Sin ejes decorativos
 *
 * Rejilla horizontal tenue, sin líneas verticales y sin marcas en los ejes. Lo
 * que importa es la forma de la serie, no la cuadrícula.
 */
/** Envoltura común: título, acciones y el alto reservado. */
export function ChartCard({
  titulo,
  detalle,
  acciones,
  alto = 220,
  children,
  className,
}: {
  titulo: string;
  detalle?: string;
  acciones?: ReactNode;
  alto?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-xl border border-outline-variant bg-surface-container p-4',
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-on-surface">{titulo}</h3>
          {detalle && <p className="mt-0.5 text-xs text-on-surface-variant">{detalle}</p>}
        </div>
        {acciones}
      </div>

      {/* El alto se reserva antes de que el gráfico mida: sin esto, Recharts
          calcula sobre cero y la primera pintada sale vacía. */}
      <div style={{ height: alto }}>
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

type PuntoSerie = { etiqueta: string; valor: number };

/** Área rellena. Para evolución en el tiempo. */
export function SerieArea({ datos, id }: { datos: readonly PuntoSerie[]; id: string }) {
  return (
    <AreaChart data={[...datos]} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity={0.35} />
          <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="2 4" stroke="var(--color-outline-variant)" vertical={false} />
      <XAxis dataKey="etiqueta" {...EJE} />
      <YAxis {...EJE} width={40} />
      <RechartsTooltip {...ESTILO_TOOLTIP} />
      <Area
        type="monotone"
        dataKey="valor"
        name="Total"
        stroke="var(--color-secondary)"
        strokeWidth={2}
        fill={`url(#${id})`}
      />
    </AreaChart>
  );
}

/** Barras. Para comparar categorías. */
export function SerieBarras({ datos }: { datos: readonly PuntoSerie[] }) {
  return (
    <BarChart data={[...datos]} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
      <CartesianGrid strokeDasharray="2 4" stroke="var(--color-outline-variant)" vertical={false} />
      <XAxis dataKey="etiqueta" {...EJE} />
      <YAxis {...EJE} width={40} />
      <RechartsTooltip {...ESTILO_TOOLTIP} />
      <Bar dataKey="valor" name="Total" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
    </BarChart>
  );
}

/** Anillo. Para repartos de pocas partes; con más de cinco deja de leerse. */
export function SerieAnillo({ datos }: { datos: readonly PuntoSerie[] }) {
  return (
    <PieChart>
      <RechartsTooltip {...ESTILO_TOOLTIP} />
      <Pie
        data={[...datos]}
        dataKey="valor"
        nameKey="etiqueta"
        innerRadius="58%"
        outerRadius="86%"
        paddingAngle={3}
        stroke="none"
      >
        {datos.map((punto, indice) => (
          <Cell
            key={punto.etiqueta}
            fill={COLORES_SERIE[indice % COLORES_SERIE.length]}
          />
        ))}
      </Pie>
    </PieChart>
  );
}
