// import * as bt from 'botasaurus/output';
import { snakeCase, capitalCase as titleCase } from 'change-case';
// import { snakeCase, capitalCase as titleCase } from './change-case';

import { isEmpty } from './utils'
import { isNotNullish, isNullish } from './null-utils';

abstract class BaseSort {
  constructor(
    public field: string,
    options: {
      label?: string | null;
      isDefault?: boolean;
    } = {}
  ) {
    this.label = options.label || null;
    this.isDefault = options.isDefault || false;
    this.reverse = false;
    const className = snakeCase(this.getClassName());
    this.id = `${field}_${className}`;
  }

  protected reverse: boolean;
  public id: string;
  public label: string | null;
  public isDefault: boolean;

  protected abstract getLabel(): string;

  protected getSortKey(): (item: any) => any {
    
    return (item: any) => {
      const value = item[this.field];
      
      if (isNullish(value)) {
        const noneValue = this.reverse ? [0] : [3];
        return noneValue;
      }

      return typeof value === 'number' ? [1, value] : [2, value];
    };
  }

  private compareSortKeys(keyA: any, keyB: any): number {
    if (Array.isArray(keyA) && Array.isArray(keyB)) {
      // Compare list (tuple equivalent) values
      for (let i = 0; i < Math.min(keyA.length, keyB.length); i++) {
        if (keyA[i] < keyB[i]) {
          return this.reverse ? 1 : -1;
        } else if (keyA[i] > keyB[i]) {
          return this.reverse ? -1 : 1;
        }
      }
      return this.reverse ? keyB.length - keyA.length : keyA.length - keyB.length;
    }

    // Compare other types of values
    if (keyA < keyB) {
      return this.reverse ? 1 : -1;
    } else if (keyA > keyB) {
      return this.reverse ? -1 : 1;
    } else {
      return 0;
    }
  }

  public apply(data: any[]): any[] {
    const copy = [...data];
    this.applyInPlace(copy);
    return copy;
  }

  public applyInPlace(data: any[]): void {
    const calculateSortKey = this.getSortKey();
    const cache = new Map<any, any>();

    const keyOf = (item: any) => {
      if (cache.has(item)) {
        return cache.get(item);
      }
      const key = calculateSortKey(item);
      cache.set(item, key);
      return key;
    };

    data.sort((a, b) => this.compareSortKeys(keyOf(a), keyOf(b)));
  }

  public toJson(): { id: string; label: string } {
    return {
      id: this.id,
      label: this.label || this.getLabel(),
    };
  }

  abstract getClassName(): string;
}

class NumericAscendingSort extends BaseSort {
  protected getLabel(): string {
    const titleCasedField = titleCase(this.field);
    return `${titleCasedField} -- Low to High`;
  }

  public getClassName(): string {
    return 'NumericAscendingSort';
  }
}

class NumericDescendingSort extends BaseSort {
  constructor(field: string, options: { label?: string | null; isDefault?: boolean } = {}) {
    super(field, options);
    this.reverse = true;
  }

  protected getLabel(): string {
    const titleCasedField = titleCase(this.field);
    return `${titleCasedField} -- High to Low`;
  }

  public getClassName(): string {
    return 'NumericDescendingSort';
  }
}

class TrueFirstSort extends BaseSort {
  protected override getSortKey(): (item: any) => number {
    return (item: any) => {
      const value = item[this.field];
      return value === true ? 0 : value === false ? 1 : 2;
    };
  }

  protected getLabel(): string {
    const titleCasedField = titleCase(this.field);
    return `Results With ${titleCasedField} First`;
  }

  public getClassName(): string {
    return 'TrueFirstSort';
  }
}

class FalseFirstSort extends BaseSort {
  protected override getSortKey(): (item: any) => number {
    return (item: any) => {
      const value = item[this.field];
      return value === false ? 0 : value === true ? 1 : 2;
    };
  }

  protected getLabel(): string {
    const titleCasedField = titleCase(this.field);
    return `Results Without ${titleCasedField} First`;
  }

  public getClassName(): string {
    return 'FalseFirstSort';
  }
}

class TruthyFirstSort extends BaseSort {
  protected override getSortKey(): (item: any) => number {
    return (item: any) => {
      return !Boolean(item[this.field]) ? 1 : 0;
    };
  }

  protected getLabel(): string {
    const titleCasedField = titleCase(this.field);
    return `Results With ${titleCasedField} First`;
  }

  public getClassName(): string {
    return 'TruthyFirstSort';
  }
}

class FalsyFirstSort extends BaseSort {
  protected override getSortKey(): (item: any) => number {
    return (item: any) => {
      return Boolean(item[this.field]) ? 1 : 0;
    };
  }

  protected getLabel(): string {
    const titleCasedField = titleCase(this.field);
    return `Results Without ${titleCasedField} First`;
  }

  public getClassName(): string {
    return 'FalsyFirstSort';
  }
}

class NullsFirstSort extends BaseSort {
  protected override getSortKey(): (item: any) => number {
    return (item: any) => {
      return isNullish(item[this.field]) ? 0 : 1;
    };
  }

  protected getLabel(): string {
    const titleCasedField = titleCase(this.field);
    return `Results Without ${titleCasedField} First`;
  }

  public getClassName(): string {
    return 'NullsFirstSort';
  }
}

class NullsLastSort extends BaseSort {
  protected override getSortKey(): (item: any) => number {
    return (item: any) => {
      return isNullish(item[this.field]) ? 1 : 0;
    };
  }

  protected getLabel(): string {
    const titleCasedField = titleCase(this.field);
    return `Results With ${titleCasedField} First`;
  }

  public getClassName(): string {
    return 'NullsLastSort';
  }
}

abstract class _DateSort extends BaseSort {
  constructor(
    field: string,
    options: {
      label?: string | null;
      isDefault?: boolean;
    } = {}
  ) {
    super(field, options);
  }

  protected parseDate(dateStr: string): Date {
    return new Date(dateStr);
  }

  protected override getSortKey(): (item: any) => [number, number] | [number] {
    return (item: any) => {
      const dateStr = item[this.field];
      if (isNotNullish(dateStr)) {
        try {
          const dateObj = this.parseDate(dateStr);
          return [0, -dateObj.getTime()];
        } catch (error) {
          // Ignore parsing errors
        }
      }
      return [1];
    };
  }
}

class NewestDateFirstSort extends _DateSort {
  protected getLabel(): string {
    const titleCasedField = titleCase(this.field);
    return `${titleCasedField} -- Newest First`;
  }

  public getClassName(): string {
    return 'NewestDateFirstSort';
  }
}

class OldestDateFirstSort extends _DateSort {
  protected override getSortKey(): (item: any) => [number, number] | [number] {
    return (item: any) => {
      const dateStr = item[this.field];
      if (isNotNullish(dateStr)) {
        try {
          const dateObj = this.parseDate(dateStr);
          return [0, dateObj.getTime()];
        } catch (error) {
          // Ignore parsing errors
        }
      }
      return [1];
    };
  }

  protected getLabel(): string {
    const titleCasedField = titleCase(this.field);
    return `${titleCasedField} -- Oldest First`;
  }

  public getClassName(): string {
    return 'OldestDateFirstSort';
  }
}

class AlphabeticAscendingSort extends BaseSort {
  protected getLabel(): string {
    const titleCasedField = titleCase(this.field);
    return `${titleCasedField} -- A to Z`;
  }

  public getClassName(): string {
    return 'AlphabeticAscendingSort';
  }
}

class AlphabeticDescendingSort extends BaseSort {
  constructor(field: string, options: { label?: string | null; isDefault?: boolean } = {}) {
    super(field, options);
    this.reverse = true;
  }

  protected getLabel(): string {
    const titleCasedField = titleCase(this.field);
    return `${titleCasedField} -- Z to A`;
  }

  public getClassName(): string {
    return 'AlphabeticDescendingSort';
  }
}

class Sort extends BaseSort {
  constructor(label: string, sorts: BaseSort[], options: { isDefault?: boolean } = {}) {
    super(null as any, { label, isDefault: options.isDefault });
    this.sorts = sorts || [];

    const className = snakeCase(this.getClassName());
    const labelCased = snakeCase(label);

    this.id = `${labelCased}_${className}`;
  }

  public sorts: BaseSort[];

  public override apply(data: any[]): any[] {
    const copy = [...data];
    this.applyInPlace(copy);
    return copy;
  }

  public override applyInPlace(data: any[]): void {
    // acts as the primary sort key (relies on Node/V8 stable Array.sort).
    for (const sort of this.sorts) {
      sort.applyInPlace(data);
    }
  }

  protected getLabel(): string {
    return this.label ?? 'Sort';
  }

  public getClassName(): string {
    return 'Sort';
  }
}

export function applySorts(data: any[], sortData: string | null, sortObjects: BaseSort[]): any[] {
  if (isEmpty(sortData)) {
    return data;
  }

  for (const s of sortObjects) {
    if (s.id === sortData) {
      s.applyInPlace(data);
      break;
    }
  }

  return data;
}

export {
  BaseSort,
  NumericAscendingSort,
  NumericDescendingSort,
  TrueFirstSort,
  FalseFirstSort,
  TruthyFirstSort,
  FalsyFirstSort,
  NullsFirstSort,
  NullsLastSort,
  NewestDateFirstSort,
  OldestDateFirstSort,
  AlphabeticAscendingSort,
  AlphabeticDescendingSort,
  Sort,
};

// const bestCustomers = new Sort('Tech Savvya, High Earners', [
//   // new AlphabeticAscendingSort('name'),
//   // new NumericDescendingSort('reviews'),
//   new TruthyFirstSort('website'),
// ])



// const dt = bt.readJson('/Users/om/Downloads/Google Maps Extractor/all-task-1.json')
// // new NumericDescendingSort('reviews').applyInPlace(dt)
// bestCustomers.applyInPlace(dt)

// bt.writeTempJson(dt)
