import { redirect } from 'next/navigation';
import { PanelSession, leerUsuarioDeSesion } from '@/features/auth';

/**
 * Armazón del panel.
 *
 * Es un Server Component: lee la cookie de sesión **antes de renderizar**, así
 * que la pantalla protegida no llega a pintarse sin sesión. El `middleware` ya
 * redirige, y esto es la segunda comprobación — la que garantiza que los datos
 * del usuario vienen del servidor y no de algo que el navegador podría editar.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const usuario = await leerUsuarioDeSesion();
  if (!usuario) redirect('/');

  return (
    <PanelSession
      usuario={{
        usuarioId: usuario.usuarioId,
        nombre: usuario.nombreCompleto,
        rol: usuario.rolNombre,
      }}
      marcadorBusqueda="Buscar por nombre…"
    >
      {children}
    </PanelSession>
  );
}
