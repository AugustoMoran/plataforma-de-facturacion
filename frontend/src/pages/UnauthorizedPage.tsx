import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <p className="text-6xl">🔒</p>
        <h1 className="text-2xl font-bold text-foreground">Acceso denegado</h1>
        <p className="text-muted-foreground">No tenés permisos para acceder a esta sección.</p>
        <Link
          to="/dashboard"
          className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Ir al dashboard
        </Link>
      </div>
    </div>
  );
}
