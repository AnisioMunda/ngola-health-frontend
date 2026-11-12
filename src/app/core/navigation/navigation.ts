import { ACCESS, Role } from '../auth/roles';

/**
 * Áreas da aplicação. Fonte única para o menu do cabeçalho e para os cartões da página inicial:
 * ao acrescentar um módulo, acrescenta-se aqui e aparece nos dois sítios.
 */
export interface AppArea {
  label: string;
  path: string;
  /** Descrição curta mostrada no cartão da página inicial. */
  description: string;
  /** Perfis com acesso; deve coincidir com o roleGuard da rota. */
  roles: readonly Role[];
}

export const APP_AREAS: readonly AppArea[] = [
  {
    label: 'Pacientes',
    path: '/patients',
    description: 'Pesquisar, registar e consultar fichas.',
    roles: ACCESS.patientsRead,
  },
  {
    label: 'Triagem',
    path: '/triage',
    description: 'Fila da urgência por prioridade (Manchester).',
    roles: ACCESS.patientsRead,
  },
  {
    label: 'Episódios',
    path: '/episodes',
    description: 'Lista de trabalho: consultas, urgências e exames.',
    roles: ACCESS.patientsRead,
  },
  {
    label: 'Prescrições',
    path: '/prescriptions',
    description: 'Receitas emitidas e por dispensar.',
    roles: ACCESS.prescriptionsRead,
  },
  {
    label: 'Laboratório',
    path: '/lab',
    description: 'Pedidos de exames, colheitas e resultados.',
    roles: ACCESS.labRead,
  },
  {
    label: 'Farmácia',
    path: '/pharmacy',
    description: 'Catálogo, stock, lotes e dispensa.',
    roles: ACCESS.pharmacyRead,
  },
  {
    label: 'Hospitais',
    path: '/hospitals',
    description: 'Instituições registadas na plataforma.',
    roles: ACCESS.hospitals,
  },
  {
    label: 'Utilizadores',
    path: '/users',
    description: 'Contas, perfis e senhas.',
    roles: ACCESS.usersRead,
  },
  {
    label: 'Auditoria',
    path: '/audit',
    description: 'Quem fez o quê, e quando.',
    roles: ACCESS.audit,
  },
];

/** Áreas visíveis para um utilizador com estes perfis. */
export function areasFor(hasAnyRole: (roles: readonly Role[]) => boolean): AppArea[] {
  return APP_AREAS.filter((area) => hasAnyRole(area.roles));
}
