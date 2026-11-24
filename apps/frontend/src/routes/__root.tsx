import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <main className="mx-auto max-w-5xl p-8">
      <nav className="flex gap-6 border-b pb-4"><Link to="/">Início</Link><Link to="/about">Sobre</Link><Link to="/connection">Conexão</Link></nav>
      <Outlet />
    </main>
  ),
  notFoundComponent: () => <p>Página não encontrada.</p>,
})

