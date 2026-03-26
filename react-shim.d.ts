declare module 'react' {
  export = React;
  export as namespace React;

  namespace React {
    type ReactNode = any;
    type FC<P = any> = (props: P) => any;
    type FormEvent<T = any> = any;
    type ChangeEvent<T = any> = any;
    type KeyboardEvent<T = any> = any;
    type SVGProps<T = any> = any;
    const StrictMode: any;
    class Component<P = any, S = any> {
      constructor(props: P);
      props: P;
      state: S;
      setState(state: Partial<S>): void;
    }
    function createContext<T>(value: T): { Provider: any; Consumer: any };
    function useContext<T>(ctx: any): T;
    function useMemo<T>(factory: () => T, deps: any[]): T;
    function useState<T>(initial: T | (() => T)): [T, (next: T | ((prev: T) => T)) => void];
    function useEffect(effect: () => void | (() => void), deps?: any[]): void;
    function useRef<T>(initial: T): { current: T };
    function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
    function createElement(type: any, props?: any, ...children: any[]): any;
  }
}

declare module 'react/jsx-runtime' {
  export const Fragment: any;
  export function jsx(type: any, props: any, key?: any): any;
  export function jsxs(type: any, props: any, key?: any): any;
}

declare module 'react-dom/client' {
  export function createRoot(container: Element): { render(node: any): void };
}

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      key?: string | number;
    }
  }
}
