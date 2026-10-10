import { isoDate, weekday } from './iso-date';

/** Shape of `calendar.json`, as `training/src/calendar_bo.py` exports it. */
export interface CalendarDefinition {
  firstYear: number;
  lastYear: number;
  holidays: string[];
  vacations: { from: string; to: string }[];
}

/** Bolivian holidays and university vacations; training and the API read the same `calendar.json`. */
export class OperatingCalendar {
  private readonly holidays: ReadonlySet<string>;

  constructor(private readonly definition: CalendarDefinition) {
    this.holidays = new Set(definition.holidays);
  }

  get firstYear(): number {
    return this.definition.firstYear;
  }

  get lastYear(): number {
    return this.definition.lastYear;
  }

  covers(date: string): boolean {
    const year = Number(date.slice(0, 4));
    return year >= this.definition.firstYear && year <= this.definition.lastYear;
  }

  isClassDay(day: number): boolean {
    const text = isoDate(day);
    return weekday(day) < 5 && !this.holidays.has(text) && !this.isVacation(text);
  }

  /** Share of class days in the closed interval [start, end]. */
  classDayShare(start: number, end: number): number {
    if (end < start) return 0;
    let classDays = 0;
    for (let day = start; day <= end; day += 1) {
      if (this.isClassDay(day)) classDays += 1;
    }
    return classDays / (end - start + 1);
  }

  private isVacation(text: string): boolean {
    const key = text.slice(5);
    return this.definition.vacations.some(({ from, to }) => from <= key && key <= to);
  }
}
