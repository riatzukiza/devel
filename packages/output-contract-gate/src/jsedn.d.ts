declare module 'jsedn' {
  const jsedn: {
    parse(source: string): unknown;
    toJS(value: unknown): unknown;
  };

  export default jsedn;
}