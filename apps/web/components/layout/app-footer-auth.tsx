import Link from "next/link";

export default function AppFooterAuth() {
  return (
    <footer className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-muted-foreground px-4">
      <p>
        © {new Date().getFullYear()} Óticas Queiroz. Todos os direitos
        reservados.
      </p>
      <p className="mt-1">
        Desenvolvido por{" "}
        <Link
          href="https://matheusqueiroz.dev.br"
          target="_blank"
          className="font-medium hover:underline text-[var(--primary-blue)] hover:text-primary"
        >
          Matheus Queiroz
        </Link>
      </p>
    </footer>
  );
}

