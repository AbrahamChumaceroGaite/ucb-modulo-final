import { ApiError, messageOf } from '@/shared/api/api-error';
import { ROUTES } from '@/shared/config/routes';
import { Button } from './button';
import { Notice } from './notice';

/**
 * A failed request, said in the API's own words. An ended session offers to
 * sign in again (retrying would fail the same way); anything else, a retry.
 */
export function ErrorNotice({ title, error, onRetry }: { title: string; error: unknown; onRetry?: () => void }) {
  const sessionOver = error instanceof ApiError && error.status === 401;
  const action = sessionOver ? (
    <a href={ROUTES.signIn} className="text-sm font-medium text-primary underline underline-offset-4">
      Volver a entrar
    </a>
  ) : (
    onRetry && <Button onClick={onRetry}>Reintentar</Button>
  );

  return (
    <Notice tone="error" title={title} action={action}>
      {messageOf(error)}
    </Notice>
  );
}
