/**
 * @fileoverview Type declarations for kit-js modules
 */

declare module '@kit-js/core/js/util' {
  export function create(constructor: any, ...args: any[]): any;
  export function extend(target: any, source: any): any;
  export function mixin(target: any, source: any): any;
  export function conditional(condition: any, ...args: any[]): any;
  export function cond(pairs: any[][]): any;
  export function partiallyApplyAfter(fn: any, ...args: any[]): any;
}

declare module '@kit-js/http/index.js' {
  export function Server(port: number): any;
  export function Router(routes?: any): any;
  export const MiddleWare: any;
}

declare module '@kit-js/interface' {
  export function Interface(definition: any): any;
}

declare module 'kit-file-system' {
  export const FileSystem: {
    load(path: string): any;
  };
  export function serveStaticFiles(filesystem: any): any;
}

declare module 'kit-actor' {
  export const Actor: {
    define(name: string, methods: any): any;
  };
  export function sendTo(actor: any, message: any): Promise<any>;
}

declare module 'kit-events' {
  export function EventEmitter(): any;
  export function emit(eventName: string, ...args: any[]): any;
  export function bubble(emitter: any, eventName: string): any;
}

declare module 'kit-async' {
  export const Future: {
    Object: {
      all: any;
    }
  };
  export function asyncLet(bindings: any, body: any): any;
}

declare module 'ramda' {
  export function curry(fn: any): any;
  export function tap(fn: any): any;
}
