'use client';

import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mensajeDe } from './api-error';

/**
 * Las dos formas que tiene un caso de uso de hablar con una colección.
 *
 * ## Por qué existen
 *
 * Cada colección —productos, usuarios, clientes— tiene los mismos cuatro
 * casos de uso, y en los cuatro se repetía **la misma fontanería**: la clave
 * de caché, `placeholderData` para que la lista no parpadee, la invalidación
 * tras escribir y los dos avisos. Con tres colecciones eran doce copias de
 * cuatro líneas cada una, y la primera que se olvidara de invalidar iba a
 * tardar semanas en descubrirse.
 *
 * ## Lo que NO hacen
 *
 * No son un caso de uso. No saben qué se lista, no traen textos y no eligen
 * qué invalidar: eso lo pone cada `use-*.ts`, que sigue existiendo uno por
 * acción y con su nombre. Aquí solo vive lo que era idéntico.
 *
 * Es la línea que separa una abstracción útil de un motor genérico: si algún
 * día una colección necesita otra política de caché, se escribe su hook a
 * mano y estas funciones no estorban.
 */

/**
 * Lectura de una colección. La página anterior se queda mientras llega la
 * siguiente.
 *
 * `activa` existe para las pantallas con pestañas: la colección que no se está
 * mirando **no se pide**. Sin esto, abrir Usuarios traería también los
 * clientes, y al revés — dos peticiones por visita para enseñar una.
 */
export function useColeccion<T>(clave: QueryKey, cargar: () => Promise<T>, activa = true) {
  return useQuery({
    queryKey: clave,
    queryFn: cargar,
    enabled: activa,
    // Sin esto la lista parpadea a vacío en cada cambio de página o de filtro.
    placeholderData: (anterior) => anterior,
  });
}

/**
 * Escritura sobre una colección: ejecuta, invalida y avisa.
 *
 * La invalidación va pegada a la escritura, no en un efecto aparte con una
 * lista de acciones que hay que acordarse de ampliar — eso ya falló una vez en
 * el proyecto que auditamos.
 */
export function useAccionSobreColeccion<Entrada, Salida>({
  ejecutar,
  invalidar,
  exito,
  alTerminar,
}: {
  ejecutar: (entrada: Entrada) => Promise<Salida>;
  /** Qué ramas de caché dejan de ser de fiar después de esto. */
  invalidar: readonly QueryKey[];
  /** El aviso. Recibe lo que devolvió el servidor, no lo que se envió. */
  exito: (resultado: Salida) => string;
  alTerminar?: (resultado: Salida) => void;
}) {
  const cliente = useQueryClient();

  return useMutation({
    mutationFn: ejecutar,
    onSuccess: (resultado) => {
      toast.success(exito(resultado));
      for (const clave of invalidar) void cliente.invalidateQueries({ queryKey: clave });
      alTerminar?.(resultado);
    },
    onError: (error) => toast.error(mensajeDe(error)),
  });
}
