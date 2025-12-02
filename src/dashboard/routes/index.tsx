import React, { useEffect } from "react";
import {
  HashRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Layout } from "@wix/design-system";
import { useRecoilState } from "recoil";
import { activeRouteIdState } from "../services/state";

// import StatisticsTab from "../pages/StatisticsTab";
// import SettingsTab from "../pages/SettingsTab";
import GalleryTab from "../pages/GalleryTab";
import ProductsTab from "../pages/ProductsTab";

// Sync Recoil state with React Router location
const SyncRecoilWithRouter: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeRouteId, setActiveRouteId] = useRecoilState(activeRouteIdState);

  // useEffect(() => {
  //   const currentRoute = ROUTES.find(
  //     (route) => route.path === location.pathname
  //   );
  //   if (currentRoute) {
  //     setActiveRouteId(currentRoute.id);
  //   }
  // }, [location, setActiveRouteId]);

  // Navigate when activeRouteId changes
  useEffect(() => {
    const activeRoute = ROUTES.find((route) => route.id === activeRouteId);
    const alreadyOnRoute = activeRoute?.path === location.pathname;
    if (!activeRoute || alreadyOnRoute) return;

    navigate(activeRoute.path);
  }, [activeRouteId]);

  return null;
};

// Route configuration interface
interface AppRoute {
  id: number;
  title: string;
  path: string;
  element: React.ReactElement;
}

// Define all available routes
export const ROUTES: AppRoute[] = [
  // { id: 1, title: "Overview", path: "/", element: <StatisticsTab /> },
  { id: 2, title: "Products", path: "/products", element: <ProductsTab /> },
  { id: 3, title: "Draft Images", path: "/gallery", element: <GalleryTab /> },
  // { id: 4, title: "Settings", path: "/settings", element: <SettingsTab /> },
];

// Note: Route titles are used in TabNavigator, which will need i18next support if needed

const AppRouter: React.FC = () => (
  <Layout>
    <HashRouter>
      <SyncRecoilWithRouter />
      <Routes>
        {ROUTES.map((route) => (
          <Route key={route.id} path={route.path} element={route.element} />
        ))}
        <Route path="*" element={<ProductsTab />} />
      </Routes>
    </HashRouter>
  </Layout>
);

export default AppRouter;
