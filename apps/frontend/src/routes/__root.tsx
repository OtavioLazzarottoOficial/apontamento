import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <main>
      <Outlet />
    </main>
  ),
  notFoundComponent: () => <p>Página não encontrada.</p>,
});
