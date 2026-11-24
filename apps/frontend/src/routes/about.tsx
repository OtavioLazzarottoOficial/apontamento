import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({ component: () => <section className="py-12"><h1 className="text-2xl font-semibold">Sobre o projeto</h1><p className="mt-4">Sistema de edição de mapas de sequenciamento.</p></section> })
