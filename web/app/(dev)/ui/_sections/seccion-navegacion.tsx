'use client';

import { useState } from 'react';
import { Breadcrumbs, Button, Pagination, Stepper } from '@/shared/ui/primitives';
import { Muestra, Seccion } from '../_components/showcase';
import { PASOS } from '../_data/navegacion';

/**
 * Cómo se recorre el producto.
 *
 * El menú principal no está aquí: vive abajo, flotando, y se ve en esta misma
 * pantalla. No hay barra lateral en ninguna medida — se come 200 px de ancho
 * para repetir cuatro enlaces y en móvil hay que esconderla detrás de una
 * hamburguesa que nadie pulsa.
 */
export function SeccionNavegacion() {
  const [paso, setPaso] = useState(1);
  const [skip, setSkip] = useState(20);
  const [limit, setLimit] = useState(10);

  return (
    <Seccion
      id="navegacion"
      titulo="Navegación"
      descripcion="Migas, pasos y paginación. El menú principal no se enseña aquí porque ya lo tienes delante: es la barra de abajo, la de verdad. Tuvo una réplica estática en esta sección y duró exactamente hasta el primer cambio del componente real."
    >
      <Muestra titulo="Migas" nota="La última nunca es enlace: es dónde estás, no a dónde puedes ir." className="block">
        <Breadcrumbs migas={[{ etiqueta: 'Inicio', href: '/productos' }, { etiqueta: 'Insumos' }]} />
        <div className="mt-2">
          <Breadcrumbs
            migas={[
              { etiqueta: 'Inicio', href: '/productos' },
              { etiqueta: 'Insumos', href: '/productos' },
              { etiqueta: 'House Espresso' },
            ]}
          />
        </div>
      </Muestra>

      <Muestra
        titulo="Pasos"
        nota="Se puede volver a un paso completado pulsándolo, que es lo que cualquiera intenta. Los que faltan no son pulsables."
        className="block"
      >
        <Stepper pasos={PASOS} actual={paso} onIrA={setPaso} />

        <div className="mt-4 flex items-center gap-2">
          <Button
            tono="contorno"
            medida="sm"
            disabled={paso === 0}
            onClick={() => setPaso((actual) => Math.max(0, actual - 1))}
          >
            Atrás
          </Button>
          <Button
            tono="primary"
            medida="sm"
            disabled={paso === PASOS.length - 1}
            onClick={() => setPaso((actual) => Math.min(PASOS.length - 1, actual + 1))}
          >
            Continuar
          </Button>
          <span className="text-xs text-on-surface-variant">
            En una pantalla real, «Continuar» solo avanza si el paso valida.
          </span>
        </div>
      </Muestra>

      <Muestra
        titulo="Paginación"
        nota="La misma para la tabla y para la rejilla de tarjetas. No se escribe una por pantalla."
        className="block"
      >
        <div className="rounded-xl border border-outline-variant bg-surface-container px-3">
          <Pagination
            skip={skip}
            limit={limit}
            total={148}
            onCambiar={(siguiente) => {
              setSkip(siguiente.skip);
              setLimit(siguiente.limit);
            }}
          />
        </div>
      </Muestra>

    </Seccion>
  );
}
