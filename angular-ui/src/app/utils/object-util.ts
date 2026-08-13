export function groupBy<T>(items: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const groupKey = typeof key === 'function' ? key(item) : String(item[key]);
    (acc[groupKey] = acc[groupKey] ?? []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export function cloneObject<T>(obj: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(obj)
    : JSON.parse(JSON.stringify(obj));
}

export function trimObject<T extends object>(obj: T): Partial<T> {
  return Object.keys(obj).reduce((acc, key) => {
    const value = (obj as Record<string, unknown>)[key];
    if (value !== '' && value !== null && value !== undefined) {
      acc[key as keyof T] = value as T[keyof T];
    }
    return acc;
  }, {} as Partial<T>);
}
