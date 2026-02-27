declare module 'js-yaml' {
  export function load(input: string, options?: any): any
  const YAML: { load: typeof load }
  export default YAML
}

