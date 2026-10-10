import { describe, expect, it } from 'vitest';
import { cookiesLot, modelCard, tomatoLot } from '../testing/fixtures';
import { decisionSentence, falseAlarmsPer100, leftoverText, ruleSentence, solutionLimits } from './lot-reading';

describe('leftoverText', () => {
  it('says the leftover in the product unit, rounded', () => {
    expect(leftoverText(cookiesLot)).toBe('Unos 8 und');
  });

  it('says nothing is left when the lot runs out in time', () => {
    expect(leftoverText(tomatoLot)).toBe('Nada');
  });

  it('does not guess without last week usage', () => {
    expect(leftoverText({ ...cookiesLot, estimatedLeftover: null })).toBe('Sin datos');
  });
});

describe('ruleSentence', () => {
  it.each([
    [true, 'La regla también avisa.'],
    [false, 'La regla no avisa.'],
    [null, 'La regla no tiene consumo para decidir.'],
  ])('reads %s', (rule, sentence) => {
    expect(ruleSentence(rule)).toBe(sentence);
  });
});

describe('decisionSentence', () => {
  it('asks to use a lot over the threshold first', () => {
    expect(decisionSentence(true)).toBe('Conviene usarlo antes que los otros.');
  });
});

describe('solutionLimits', () => {
  it('takes its numbers from the model card', () => {
    const limits = solutionLimits(modelCard).join(' ');
    expect(limits).toContain('los 3 perecederos');
    expect(limits).toContain(`${falseAlarmsPer100(modelCard.metrics.model.precision)} de cada 100 avisos son falsas alarmas`);
    expect(falseAlarmsPer100(0.4723)).toBe(53);
  });

  it('says honestly that the rule gets more answers right overall', () => {
    expect(solutionLimits(modelCard).join(' ')).toMatch(/gana la regla: 90\s?% contra 88\s?%/);
  });
});
