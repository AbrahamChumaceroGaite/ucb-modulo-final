/**
 * Nombre de icono a icono de verdad.
 *
 * Existe para que `routes.ts` pueda declarar la navegación sin importar JSX:
 * la configuración dice «package» y esta tabla decide qué dibujo es.
 */

import { Boxes, CookingPot, Package, Palette, Users, Wallet } from 'lucide-react';

export const ICONOS = {
  package: Package,
  boxes: Boxes,
  recipe: CookingPot,
  cash: Wallet,
  users: Users,
  palette: Palette,
} as const;
