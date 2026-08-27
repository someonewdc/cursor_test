declare module 'hbs' {
  interface Hbs {
    registerPartial(name: string, template: string): void;
    registerPartials(directory: string, callback?: (err?: Error) => void): void;
  }

  const hbs: Hbs;
  export default hbs;
}
