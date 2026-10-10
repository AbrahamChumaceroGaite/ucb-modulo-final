import { Logger, type ArgumentsHost } from '@nestjs/common';
import { DomainException } from '../../domain/domain.exception';
import { HttpExceptionFilter, type ErrorBody } from './http-exception.filter';

function respond(exception: unknown): ErrorBody {
  let body: ErrorBody | undefined;
  const response = { status: () => ({ json: (sent: ErrorBody) => (body = sent) }) };
  const host = { switchToHttp: () => ({ getResponse: () => response }) } as unknown as ArgumentsHost;
  new HttpExceptionFilter().catch(exception, host);
  return body!;
}

describe('HttpExceptionFilter', () => {
  const logged = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  beforeEach(() => logged.mockClear());

  it('sends a domain error as it is, without logging it', () => {
    expect(respond(DomainException.unauthorized('Correo o contraseña incorrectos.'))).toMatchObject({
      status: 401,
      message: 'Correo o contraseña incorrectos.',
    });
    expect(logged).not.toHaveBeenCalled();
  });

  it('says the database is down instead of a generic failure', () => {
    const refused = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5433'), { code: 'ECONNREFUSED' });
    expect(respond(refused)).toMatchObject({ status: 503, error: 'Unavailable' });
    expect(logged).toHaveBeenCalledWith(expect.stringContaining('ECONNREFUSED'));
    expect(respond(new Error('Connection terminated unexpectedly'))).toMatchObject({ status: 503 });
  });

  it('hides the cause of any other failure from the caller but logs it', () => {
    const body = respond(new TypeError('cannot read properties of undefined'));
    expect(body).toMatchObject({ status: 500, message: 'El servicio tuvo un problema. Inténtalo otra vez.' });
    expect(logged).toHaveBeenCalledWith(expect.stringContaining('cannot read properties'));
  });
});
