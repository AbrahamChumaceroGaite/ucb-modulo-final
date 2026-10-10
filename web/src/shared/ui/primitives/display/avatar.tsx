import Image from 'next/image';
import { cn } from '@/shared/lib/cn';
import { iniciales } from '@/shared/lib/format';

/**
 * Avatar con reserva por iniciales.
 *
 * Si no hay foto, las iniciales. Nunca un icono de persona genérico: dos letras
 * identifican a alguien y una silueta gris no identifica a nadie.
 */
export function Avatar({
  nombre,
  src,
  medida = 'md',
  className,
}: {
  nombre: string;
  src?: string | null;
  medida?: 'sm' | 'md';
  className?: string;
}) {
  const lado = medida === 'sm' ? 32 : 40;

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'bg-primary-container text-on-primary-container',
        medida === 'sm' ? 'size-8 text-[0.625rem]' : 'size-10 text-xs',
        'font-semibold',
        className,
      )}
      title={nombre}
    >
      {src ? (
        <Image src={src} alt={nombre} width={lado} height={lado} className="size-full object-cover" />
      ) : (
        <span aria-hidden>{iniciales(nombre)}</span>
      )}
      <span className="sr-only">{nombre}</span>
    </span>
  );
}
