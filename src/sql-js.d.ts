// sql.js is loaded from CDN via script tag in index.html
// The global window.initSqlJs is declared in DatabaseContext.tsx
// This file prevents TypeScript errors for any residual sql.js references

declare module 'sql.js' {
  interface QueryExecResult {
    columns: string[];
    values: any[][];
  }
  interface Database {
    run(sql: string, params?: any[]): Database;
    exec(sql: string): QueryExecResult[];
    close(): void;
  }
  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database;
  }
  export default function initSqlJs(config?: { locateFile?: (file: string) => string }): Promise<SqlJsStatic>;
}
