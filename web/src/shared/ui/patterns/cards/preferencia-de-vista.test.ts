import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { recordarVista, useVistaPreferida } from './preferencia-de-vista';

/**
 * El orden de precedencia entre la URL y lo guardado.
 *
 * Es la única decisión delicada de esta pieza: **la URL siempre gana**. Si lo
 * guardado pudiera pisarla, un enlace compartido enseñaría una cosa a quien lo
 * manda y otra a quien lo abre — que es justo lo que la regla 8.11 evita al
 * poner en la dirección lo que se está mirando.
 *
 * Lo guardado es el valor por omisión, no el valor.
 */
afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('useVistaPreferida', () => {
  it('sin nada en la URL ni guardado, la rejilla', () => {
    const { result } = renderHook(() => useVistaPreferida('ventas', null));
    expect(result.current).toBe('rejilla');
  });

  it('lo que dice la URL manda', () => {
    recordarVista('ventas', 'lista');
    const { result } = renderHook(() => useVistaPreferida('ventas', 'tabla'));
    expect(result.current).toBe('tabla');
  });

  it('sin nada en la URL, la última que se eligió', () => {
    recordarVista('ventas', 'tabla');
    const { result } = renderHook(() => useVistaPreferida('ventas', null));
    expect(result.current).toBe('tabla');
  });

  it('la preferencia es por pantalla: productos no hereda la de ventas', () => {
    recordarVista('ventas', 'tabla');
    const { result } = renderHook(() => useVistaPreferida('productos', null));
    expect(result.current).toBe('rejilla');
  });

  it('una vista inventada en la URL no se respeta: se cae a la preferencia', () => {
    recordarVista('ventas', 'compacta');
    const { result } = renderHook(() => useVistaPreferida('ventas', 'tarta'));
    expect(result.current).toBe('compacta');
  });

  it('una vista inventada guardada tampoco se respeta', () => {
    window.localStorage.setItem('kh:vista:ventas', 'tarta');
    const { result } = renderHook(() => useVistaPreferida('ventas', null));
    expect(result.current).toBe('rejilla');
  });

  it('elegir otra vista se refleja sin recargar', () => {
    const { result } = renderHook(() => useVistaPreferida('ventas', null));
    expect(result.current).toBe('rejilla');

    act(() => recordarVista('ventas', 'lista'));
    expect(result.current).toBe('lista');
  });

  /**
   * En modo privado, con las cookies bloqueadas o con la cuota llena,
   * `localStorage` **lanza**. Una preferencia no es un dato que se pueda
   * perder con consecuencias: la pantalla tiene que seguir funcionando y
   * limitarse a no recordar nada.
   */
  it('si el navegador no deja leer, no revienta: se usa la rejilla', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('acceso denegado');
    });

    const { result } = renderHook(() => useVistaPreferida('ventas', null));
    expect(result.current).toBe('rejilla');
  });

  it('si el navegador no deja escribir, tampoco revienta', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('cuota llena');
    });

    expect(() => recordarVista('ventas', 'tabla')).not.toThrow();
  });
});
