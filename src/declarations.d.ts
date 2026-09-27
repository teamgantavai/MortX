declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const content: any;
  export default content;
}

declare module '*.png' {
  const content: any;
  export default content;
}

declare module '*.jpg' {
  const content: any;
  export default content;
}

declare module 'react-dom/client' {
  const content: any;
  export default content;
  export function createRoot(container: Element | DocumentFragment): any;
}
