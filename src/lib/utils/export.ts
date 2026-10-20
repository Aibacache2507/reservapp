/**
 * Utilidades para exportación de datos a formato CSV compatible con Excel en español (UTF-8 con BOM)
 */

/**
 * Convierte un arreglo de objetos en una cadena CSV con BOM para visualización correcta en Excel.
 */
export function generateCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; header: string; format?: (val: any) => string }[],
  delimiter: string = ";"
): string {
  if (!data || data.length === 0) {
    return "\uFEFF" + columns.map((c) => `"${c.header}"`).join(delimiter);
  }

  // Encabezados
  const headerRow = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(delimiter);

  // Filas de datos
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        const rawValue = item[col.key];
        const formatted = col.format ? col.format(rawValue) : rawValue !== undefined && rawValue !== null ? String(rawValue) : "";
        return `"${String(formatted).replace(/"/g, '""')}"`;
      })
      .join(delimiter);
  });

  // \uFEFF es el Byte Order Mark (BOM) UTF-8 requerido por Microsoft Excel para abrir acentos y caracteres chilenos
  return "\uFEFF" + [headerRow, ...rows].join("\r\n");
}
