import { clsx, type ClassValue } from "clsx";
import { storageGet, storageSet } from "./safeStorage";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getLocalStorage = (key: string): any => {
  try {
    return JSON.parse(storageGet(key) || "null");
  } catch {
    return null;
  }
};
const setLocalStorage = (key: string, value: any): void => storageSet(key, JSON.stringify(value));

export { getLocalStorage, setLocalStorage };
