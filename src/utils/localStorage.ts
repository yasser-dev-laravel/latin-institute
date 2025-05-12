
export const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage: ${error}`);
  }
};

export const getFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error retrieving from localStorage: ${error}`);
    return defaultValue;
  }
};

// Generate unique ID
export const generateId = (prefix: string = ''): string => {
  return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
};

// Generate auto-incrementing code with prefix
export const generateCode = (prefix: string, items: { code: string }[]): string => {
  const existingCodes = items
    .map(item => item.code)
    .filter(code => code.startsWith(prefix))
    .map(code => {
      const numStr = code.replace(prefix, '');
      return parseInt(numStr, 10);
    })
    .filter(num => !isNaN(num));

  const maxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
  return `${prefix}${(maxCode + 1).toString().padStart(3, '0')}`;
};
