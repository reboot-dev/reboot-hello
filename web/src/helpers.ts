export function filterSet<T>(
  set: Set<T>,
  predicate: (value: T) => boolean
): Set<T> {
  const filteredSet = new Set<T>();

  set.forEach((value) => {
    if (predicate(value)) {
      filteredSet.add(value);
    }
  });

  return filteredSet;
}

export const sleep = (seconds: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

export const randomNumberBetween = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export class Deferred<T> {
  _promise: Promise<T>;
  _deferredFn: () => Promise<T>;
  _resolve: any;
  _reject: any;

  constructor(deferredFn: () => Promise<T>) {
    this._deferredFn = deferredFn;
    this._resolve = (result: T) => {};
    this._reject = (e: unknown) => {};
    this._promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  start() {
    this._deferredFn()
      .then((result: T) => this._resolve(result))
      .catch((e: unknown) => this._reject(e));
  }

  get promise() {
    return this._promise;
  }
}

export function removeMaybeFromLocalStorage<T>(
  key: string | undefined,
  filterFn: (element: T) => boolean
) {
  if (key !== undefined) {
    const currentLocalStorageItems = JSON.parse(
      localStorage.getItem(key) || "{}"
    );

    localStorage.setItem(
      key,
      JSON.stringify(currentLocalStorageItems.filter(filterFn))
    );
  }
}

export function pushMaybeToLocalStorage<T>(
  key: string | undefined,
  element: T
) {
  if (key !== undefined) {
    const currentLocalStorageItems = JSON.parse(
      localStorage.getItem(key) || "{}"
    );
    localStorage.setItem(
      key,
      JSON.stringify([...currentLocalStorageItems, element])
    );
  }
}

export function setMaybeInLocalStorage<T>(
  key: string | undefined,
  setter: (transformer: (t: T) => T) => void,
  transformer: (t: T) => T
) {
  setter((input) => {
    const output = transformer(input);
    if (key !== undefined) {
      localStorage.setItem(key, JSON.stringify(output));
    }
    return output;
  });
}

export interface RetryForeverOptions {
  initialBackoffSeconds?: number;
  maxBackoffSeconds?: number;
  backoffMultiplier?: number;
}

export const retryForever = async <T>(
  f: () => Promise<T>,
  options?: RetryForeverOptions
): Promise<T> => {
  const {
    initialBackoffSeconds = 1,
    maxBackoffSeconds = 3,
    backoffMultiplier = 2,
  } = options || {};

  let retryAttempts = 0;

  while (true) {
    try {
      return await f();
    } catch (e: any) {
      // Implementation of backoff borrowed from
      // https://github.com/grpc/proposal/blob/master/A6-client-retries.md#exponential-backoff.
      const backoffSeconds = randomNumberBetween(
        0,
        Math.min(
          initialBackoffSeconds * backoffMultiplier ** (retryAttempts - 1),
          maxBackoffSeconds
        )
      );

      console.log(
        "Failed to execute function, retrying in " + backoffSeconds + " seconds"
      );

      await sleep(backoffSeconds);

      retryAttempts += 1;
    }
  }
};

export const parseStreamedValue = (partialValue: string): string => {
  if (partialValue.slice(-1) === "]") {
    return partialValue.substring(1, partialValue.length - 1);
  }

  return partialValue.substring(1);
};
