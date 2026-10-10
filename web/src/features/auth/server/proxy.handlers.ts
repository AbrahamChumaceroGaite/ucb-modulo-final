import 'server-only';
import { NextResponse } from 'next/server';
import { API_PREFIJO, env, RECURSOS_DE_PREDICCION } from '@/shared/config/env';
import { leerAccessToken } from './sesion.server';

/**
 * Proxy autenticado hacia Spring y hacia el servicio de predicción.
 *
 * Es la pieza que permite que el token viva en una cookie `httpOnly`: el
 * navegador llama a `/api/proxy/producto`, este handler lee la cookie **en el
 * servidor** y añade `Authorization: Bearer` antes de reenviar.
 *
 * Sin esto habría que guardar el token donde el JavaScript del navegador lo
 * alcanza, que es exactamente lo que hace el proyecto que auditamos y por lo
 * que cualquier XSS allí se lleva la sesión entera.
 *
 * Solo reenvía los cuatro verbos del contrato. `PUT` no está: las
 * actualizaciones son parciales.
 */
const VERBOS_PERMITIDOS = new Set(['GET', 'POST', 'PATCH', 'DELETE']);

export async function manejarProxy(
  peticion: Request,
  contexto: { params: Promise<{ path?: string[] }> },
): Promise<NextResponse> {
  const metodo = peticion.method.toUpperCase();

  if (!VERBOS_PERMITIDOS.has(metodo)) {
    return errorJson(405, 'MetodoNoPermitido', `El método ${metodo} no está permitido.`);
  }

  const { path } = await contexto.params;
  const ruta = (path ?? []).join('/');
  if (!ruta) return errorJson(400, 'RutaVacia', 'Falta el recurso al que llamar.');

  const token = await leerAccessToken();
  if (!token) return errorJson(401, 'SinSesion', 'Tu sesión terminó. Vuelve a entrar.');

  const consulta = new URL(peticion.url).search;
  const haciaPrediccion = esDePrediccion(ruta);
  const base = haciaPrediccion ? env.ML_API_URL : env.API_URL;
  const destino = `${base}${API_PREFIJO}/${ruta}${consulta}`;

  const cabeceras: Record<string, string> = { Authorization: `Bearer ${token}` };
  const tipo = peticion.headers.get('content-type');
  if (tipo) cabeceras['Content-Type'] = tipo;

  let respuesta: Response;
  try {
    respuesta = await fetch(destino, {
      method: metodo,
      headers: cabeceras,
      body: metodo === 'GET' || metodo === 'DELETE' ? undefined : await peticion.text(),
      cache: 'no-store',
    });
  } catch {
    return errorJson(
      502,
      'SinConexion',
      haciaPrediccion
        ? 'No se pudo contactar con el servicio de predicción. ¿Está levantado ml-api?'
        : 'No se pudo contactar con el servidor.',
    );
  }

  // 204 y respuestas sin cuerpo se reenvían tal cual: intentar leer JSON de
  // un cuerpo vacío lanzaría y convertiría un borrado correcto en un error.
  if (respuesta.status === 204) return new NextResponse(null, { status: 204 });

  const cuerpo = await respuesta.text();
  return new NextResponse(cuerpo || null, {
    status: respuesta.status,
    headers: { 'Content-Type': respuesta.headers.get('content-type') ?? 'application/json' },
  });
}

/**
 * Si la ruta va al servicio de predicción y no a Spring. Los dos validan el
 * mismo token y responden con el mismo contrato; solo cambia el puerto.
 */
function esDePrediccion(ruta: string): boolean {
  return RECURSOS_DE_PREDICCION.has(ruta.split('/')[0] ?? '');
}

function errorJson(codigo: number, tipo: string, mensaje: string): NextResponse {
  return NextResponse.json(
    { codigo, tipo, mensaje, timestamp: new Date().toISOString() },
    { status: codigo },
  );
}
