import { tourAnchor, type TourStep } from '@/shared/hooks/use-guided-tour';

/** `data-tour` values on the screen. Lot anchors sit on every card; the tour points at the first. */
export const TOUR = {
  lot: 'lot',
  facts: 'lot-facts',
  risk: 'lot-risk',
  tryLot: 'try-lot',
  filters: 'filters',
  evaluate: 'evaluate',
  model: 'model',
} as const;

export const EXPIRY_RISK_TOUR: TourStep[] = [
  {
    popover: {
      title: 'Cómo funciona',
      description: 'Cada mañana se revisan los lotes perecederos abiertos. El modelo marca los que pueden vencer sin terminarse.',
    },
  },
  {
    element: tourAnchor(TOUR.lot),
    popover: {
      title: 'Un lote',
      description: 'Los de más riesgo van arriba. La etiqueta dice qué hacer: usar primero, vigilar o nada.',
    },
  },
  {
    element: tourAnchor(TOUR.facts),
    popover: {
      title: 'Lo que mira el modelo',
      description: 'Cuánto queda, cuánto hay por delante, el uso diario y cuándo vence. «Sobra al vencer» es una cuenta con ese uso.',
    },
  },
  {
    element: tourAnchor(TOUR.risk),
    popover: {
      title: 'El riesgo',
      description: 'La barra es la probabilidad de vencer con producto. La raya marca desde dónde se avisa. Abajo, lo que diría la regla simple.',
    },
  },
  {
    element: tourAnchor(TOUR.filters),
    popover: { title: 'Filtros', description: 'Busca un producto o mira solo los lotes para usar primero.' },
  },
  {
    element: tourAnchor(TOUR.tryLot),
    popover: { title: 'Probar cambios', description: 'Copia el lote al formulario para ver qué pasa si algo cambia.' },
  },
  {
    element: tourAnchor(TOUR.evaluate),
    popover: {
      title: 'Evaluar un lote',
      description: 'Escribe un lote o ajusta el copiado y pulsa «Evaluar lote». El modelo responde al momento. No se guarda nada.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: tourAnchor(TOUR.model),
    popover: {
      title: 'Qué tan bien funciona',
      description: 'El modelo contra la regla, en lotes que no vio al entrenar. Y lo que no puede hacer.',
    },
  },
];
