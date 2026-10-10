'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/shared/ui/button';
import { Field, controlClass } from '@/shared/ui/field';
import { evaluateLotSchema, type EvaluateLotForm as FormValues, type EvaluateLotRequest } from '../../domain/evaluate-lot.schema';
import type { CatalogProduct } from '../../domain/lot-risk.schema';

interface EvaluateLotFormProps {
  products: CatalogProduct[];
  defaultValues: FormValues;
  pending: boolean;
  onSubmit: (request: EvaluateLotRequest) => void;
  /** A submit the form itself rejected: an earlier answer no longer matches what is on screen. */
  onInvalid: () => void;
}

/** Quantities are text inputs with a decimal keyboard, so invalid input gets a message. */
const NUMBER_INPUT = { type: 'text', inputMode: 'decimal', autoComplete: 'off', className: controlClass } as const;

export function EvaluateLotForm({ products, defaultValues, pending, onSubmit, onInvalid }: EvaluateLotFormProps) {
  const { register, control, handleSubmit, formState } = useForm<FormValues, unknown, EvaluateLotRequest>({
    resolver: zodResolver(evaluateLotSchema),
    defaultValues,
  });
  const { errors } = formState;
  const productId = useWatch({ control, name: 'productId' });
  const unit = products.find((product) => product.productId === productId)?.unit;
  const inUnit = (label: string) => (unit ? `${label} (${unit})` : label);

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit, onInvalid)} className="grid gap-3 sm:grid-cols-2">
      <Field label="Producto" error={errors.productId?.message} className="sm:col-span-2">
        <select className={controlClass} {...register('productId')}>
          <option value="">Elige un producto</option>
          {products.map((product) => (
            <option key={product.productId} value={product.productId}>
              {product.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Ingresó" error={errors.receivedOn?.message}>
        <input type="date" className={controlClass} {...register('receivedOn')} />
      </Field>
      <Field label="Vence" error={errors.expiresOn?.message}>
        <input type="date" className={controlClass} {...register('expiresOn')} />
      </Field>
      <Field label="Día de revisión" error={errors.reviewedOn?.message} className="sm:col-span-2">
        <input type="date" className={controlClass} {...register('reviewedOn')} />
      </Field>
      <Field label={inUnit('Cantidad inicial')} error={errors.initialQuantity?.message}>
        <input {...NUMBER_INPUT} {...register('initialQuantity')} />
      </Field>
      <Field label={inUnit('Queda')} error={errors.remainingQuantity?.message}>
        <input {...NUMBER_INPUT} {...register('remainingQuantity')} />
      </Field>
      <Field label={inUnit('Por delante en FEFO')} hint="Lo que se usa antes que este lote." error={errors.stockAhead?.message} className="sm:col-span-2">
        <input {...NUMBER_INPUT} {...register('stockAhead')} />
      </Field>
      <Field label={inUnit('Uso diario, 7 días')} error={errors.usage7d?.message}>
        <input {...NUMBER_INPUT} {...register('usage7d')} />
      </Field>
      <Field label={inUnit('Uso diario, 28 días')} hint="Opcional." error={errors.usage28d?.message}>
        <input {...NUMBER_INPUT} {...register('usage28d')} />
      </Field>
      <Button type="submit" variant="primary" loading={pending} className="sm:col-span-2">
        Evaluar lote
      </Button>
    </form>
  );
}
