import type { SVGProps } from "react";

// Ícones de traço (24x24) desenhados inline: nada de fonte de ícones nem requisição a outro domínio.
function Icone({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconeCalendario = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <rect x="3" y="4.5" width="18" height="16" rx="3" />
    <path d="M8 2.5v4M16 2.5v4M3 10h18" />
  </Icone>
);

export const IconeLocal = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Icone>
);

export const IconeCadeado = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </Icone>
);

export const IconeSeta = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icone>
);

export const IconeCheck = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icone>
);

export const IconeAlerta = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5M12 16.2v.3" />
  </Icone>
);

export const IconeLixeira = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" />
  </Icone>
);

export const IconeBusca = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Icone>
);

export const IconeSorteio = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" />
    <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
  </Icone>
);

export const IconeAtualizar = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <path d="M20 11a8 8 0 0 0-14.5-4.5M4 4v3h3M4 13a8 8 0 0 0 14.5 4.5M20 20v-3h-3" />
  </Icone>
);

export const IconeDownload = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <path d="M12 3.5v12M7 11l5 5 5-5M4.5 20.5h15" />
  </Icone>
);

export const IconeSair =(p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 16l-4-4 4-4M6 12h10" />
  </Icone>
);

export const IconeWhatsApp = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <path d="M4 20l1.3-3.9A8 8 0 1 1 8 18.8Z" />
    <path d="M9.2 9.3c0 2.6 2.9 5.5 5.5 5.5l1.1-1.3-1.8-.9-.9.9c-.9-.4-2.1-1.6-2.5-2.5l.9-.9-.9-1.8Z" />
  </Icone>
);

export const IconeEmail = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </Icone>
);
