import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy/5 to-gold/5">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="text-6xl font-bold text-navy mb-2">404</div>
            <h1 className="text-2xl font-playfair font-semibold text-navy mb-2">
              Página Não Encontrada
            </h1>
            <p className="text-gray-600 font-poppins">
              A página que você está procurando não existe.
            </p>
          </div>
          
          <div className="space-y-3">
            <Link href="/">
              <a className="block w-full bg-navy text-white py-3 px-6 rounded-lg font-poppins font-medium hover:bg-navy/90 transition-colors">
                Voltar para Início
              </a>
            </Link>
            <Link href="/history">
              <a className="block w-full border-2 border-navy text-navy py-3 px-6 rounded-lg font-poppins font-medium hover:bg-navy/5 transition-colors">
                Ver Histórico
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
