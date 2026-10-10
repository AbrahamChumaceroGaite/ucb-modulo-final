import { NextResponse, type NextRequest } from 'next/server';

/**
 * Guardia de rutas y cierre del escaparate.
 *
 * Se llama `proxy` porque es la convención de Next 16; hasta la 15 el archivo
 * era `middleware.ts`. Mismo comportamiento, otro nombre.
 *
 * Corre **antes de renderizar**, así que quien no tiene sesión nunca llega a
 * ver un destello de la pantalla protegida. Un guard de cliente redirige
 * después de pintar, y ese parpadeo se nota.
 *
 * No valida la firma del token: eso lo hace Spring en cada petición, que es
 * quien tiene la clave. Aquí solo se comprueba que haya sesión, que es lo que
 * decide si esta pantalla tiene sentido.
 */
const COOKIE_SESION = 'kh_access';

/**
 * Lo que exige sesión. Se escribe aquí y no se deriva de `RUTAS`: este archivo
 * corre en el runtime de Edge, y arrastrar la configuración —que valida el
 * entorno del servidor al importarse— cargaría media aplicación antes del
 * primer byte.
 */
const RUTAS_PROTEGIDAS = [
  '/productos',
  '/inventario',
  '/recetas',
  '/ventas',
  '/caja',
  '/usuarios',
];

export function proxy(peticion: NextRequest) {
  const { pathname } = peticion.nextUrl;

  // El Demo UI es documentación del sistema de diseño, no producto. Auditamos
  // un panel cuya pantalla de escaparate era el 17,7 % del código y el chunk
  // más pesado de la aplicación, servida a clientes reales.
  if (pathname.startsWith('/ui') && process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 });
  }

  const protegida = RUTAS_PROTEGIDAS.some((ruta) => pathname.startsWith(ruta));
  if (protegida && !peticion.cookies.get(COOKIE_SESION)) {
    const destino = new URL('/', peticion.url);
    // De dónde venía, para volver ahí tras entrar.
    destino.searchParams.set('volverA', pathname);
    return NextResponse.redirect(destino);
  }

  return NextResponse.next();
}

/**
 * Dónde llega a correr esta función.
 *
 * **Tiene que cubrir todo `RUTAS_PROTEGIDAS`.** Tenía tres entradas para una
 * lista de seis: `/inventario`, `/recetas`, `/ventas` y `/caja` decían estar
 * protegidas aquí y el guardia no llegaba a ejecutarse en ellas. No se colaba
 * nadie —el layout del panel es un Server Component que lee la cookie y
 * redirige igual—, pero el archivo afirmaba algo que no hacía, y la protección
 * real ocurría un paso más tarde de lo que este comentario prometía.
 */
export const config = {
  matcher: [
    '/productos/:path*',
    '/usuarios/:path*',
    '/inventario/:path*',
    '/recetas/:path*',
    '/ventas/:path*',
    '/caja/:path*',
    '/ui/:path*',
  ],
};
