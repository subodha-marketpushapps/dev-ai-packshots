// Route configuration interface
export interface AppRoute {
  id: number;
  title: string;
  path: string;
  element: React.ReactElement;
}
