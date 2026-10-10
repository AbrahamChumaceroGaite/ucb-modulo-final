import { cn } from '@/shared/lib/cn';

/**
 * Serie mínima: una línea y su relleno, sin ejes, sin rejilla y sin tooltip.
 *
 * ## Por qué no es Recharts
 *
 * Para doce puntos y ninguna interacción, Recharts obligaría a marcar como
 * cliente cualquier tarjeta que la use y a hidratar un gráfico entero por cada
 * una de la fila. Esto se renderiza en el servidor y pesa lo que pesa una
 * cadena de texto.
 *
 * ## Por qué `preserveAspectRatio="none"`
 *
 * Porque aquí importa la silueta, no la escala: la curva se estira al hueco
 * que le toque —ancho de tarjeta o recuadro fijo— sin dejar márgenes muertos.
 *
 * `vectorEffect="non-scaling-stroke"` evita el efecto secundario de eso: sin
 * él, el estirado horizontal engorda el trazo y la línea sale deformada.
 *
 * `aria-hidden` porque la cifra y su variación ya dicen el dato. Una curva sin
 * ejes leída en voz alta no aporta nada.
 */
export function Sparkline({
  datos,
  className,
}: {
  /** Valores en orden cronológico. Con menos de dos no se dibuja nada. */
  datos: readonly number[];
  className?: string;
}) {
  if (datos.length < 2) return null;

  const maximo = Math.max(...datos);
  const minimo = Math.min(...datos);
  // Rango cero —todos los valores iguales— dividiría por cero; la línea queda
  // plana a media altura, que es exactamente lo que esos datos significan.
  const rango = maximo - minimo || 1;
  const paso = 100 / (datos.length - 1);

  const puntos = datos.map((valor, indice) => {
    const x = indice * paso;
    const y = 30 - ((valor - minimo) / rango) * 26 - 2;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      className={cn('pointer-events-none block', className)}
      aria-hidden
    >
      <polyline
        points={`0,30 ${puntos.join(' ')} 100,30`}
        fill="currentColor"
        fillOpacity={0.12}
        stroke="none"
      />
      <polyline
        points={puntos.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.55}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
