declare module "cytoscape-fcose" {
  const register: (cytoscape: typeof import("cytoscape")) => void;
  export default register;
}

declare module "*.css";
