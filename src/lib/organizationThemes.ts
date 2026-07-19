/**
 * Temas de Cores e Ícones por Organização
 * Define a identidade visual de cada organização do conselho
 */

import {
  Users,
  Heart,
  BookOpen,
  Users2,
  PieChart,
  Sparkles,
  Church,
  LucideIcon,
} from 'lucide-react';

export interface OrganizationTheme {
  id: string;
  name: string;
  displayName: string;
  icon: LucideIcon;
  color: {
    bg: string;
    text: string;
    border: string;
    light: string;
    dark: string;
    gradient: string;
  };
  emoji: string;
}

export const ORGANIZATION_THEMES: Record<string, OrganizationTheme> = {
  rapazes: {
    id: 'rapazes',
    name: 'Rapazes',
    displayName: '👔 Rapazes',
    icon: Users2,
    emoji: '👔',
    color: {
      bg: 'bg-blue-50',
      text: 'text-blue-900',
      border: 'border-blue-400',
      light: 'bg-blue-100',
      dark: 'bg-blue-600',
      gradient: 'from-blue-500 to-blue-700',
    },
  },
  mocas: {
    id: 'mocas',
    name: 'Moças',
    displayName: '🌸 Moças',
    icon: Heart,
    emoji: '🌸',
    color: {
      bg: 'bg-pink-50',
      text: 'text-pink-900',
      border: 'border-pink-400',
      light: 'bg-pink-100',
      dark: 'bg-pink-600',
      gradient: 'from-pink-500 to-pink-700',
    },
  },
  socorro: {
    id: 'socorro',
    name: 'Sociedade de Socorro',
    displayName: '💐 Sociedade de Socorro',
    icon: Heart,
    emoji: '💐',
    color: {
      bg: 'bg-rose-50',
      text: 'text-rose-900',
      border: 'border-rose-400',
      light: 'bg-rose-100',
      dark: 'bg-rose-600',
      gradient: 'from-rose-500 to-rose-700',
    },
  },
  elderes: {
    id: 'elderes',
    name: 'Quórum de Élderes',
    displayName: '📖 Quórum de Élderes',
    icon: BookOpen,
    emoji: '📖',
    color: {
      bg: 'bg-amber-50',
      text: 'text-amber-900',
      border: 'border-amber-400',
      light: 'bg-amber-100',
      dark: 'bg-amber-600',
      gradient: 'from-amber-500 to-amber-700',
    },
  },
  missionaria: {
    id: 'missionaria',
    name: 'Obra Missionária',
    displayName: '🌍 Obra Missionária',
    icon: Sparkles,
    emoji: '🌍',
    color: {
      bg: 'bg-green-50',
      text: 'text-green-900',
      border: 'border-green-400',
      light: 'bg-green-100',
      dark: 'bg-green-600',
      gradient: 'from-green-500 to-green-700',
    },
  },
  primaria: {
    id: 'primaria',
    name: 'Primária',
    displayName: '🎨 Primária',
    icon: PieChart,
    emoji: '🎨',
    color: {
      bg: 'bg-purple-50',
      text: 'text-purple-900',
      border: 'border-purple-400',
      light: 'bg-purple-100',
      dark: 'bg-purple-600',
      gradient: 'from-purple-500 to-purple-700',
    },
  },
  escolaDominical: {
    id: 'escolaDominical',
    name: 'Escola Dominical',
    displayName: '📚 Escola Dominical',
    icon: BookOpen,
    emoji: '📚',
    color: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-900',
      border: 'border-indigo-400',
      light: 'bg-indigo-100',
      dark: 'bg-indigo-600',
      gradient: 'from-indigo-500 to-indigo-700',
    },
  },
  temploHistoriaFamilia: {
    id: 'temploHistoriaFamilia',
    name: 'Templo e História da Família',
    displayName: '⛪ Templo e História da Família',
    icon: Church,
    emoji: '⛪',
    color: {
      bg: 'bg-cyan-50',
      text: 'text-cyan-900',
      border: 'border-cyan-400',
      light: 'bg-cyan-100',
      dark: 'bg-cyan-600',
      gradient: 'from-cyan-500 to-cyan-700',
    },
  },
  bispado: {
    id: 'bispado',
    name: 'Bispado',
    displayName: '🏛️ Bispado',
    icon: Users,
    emoji: '🏛️',
    color: {
      bg: 'bg-red-50',
      text: 'text-red-900',
      border: 'border-red-400',
      light: 'bg-red-100',
      dark: 'bg-red-600',
      gradient: 'from-red-500 to-red-700',
    },
  },
  secretario: {
    id: 'secretario',
    name: 'Secretário da Ala',
    displayName: '📋 Secretário da Ala',
    icon: BookOpen,
    emoji: '📋',
    color: {
      bg: 'bg-orange-50',
      text: 'text-orange-900',
      border: 'border-orange-400',
      light: 'bg-orange-100',
      dark: 'bg-orange-600',
      gradient: 'from-orange-500 to-orange-700',
    },
  },
};

export function getOrganizationTheme(orgId: string): OrganizationTheme {
  return (
    ORGANIZATION_THEMES[orgId] || {
      id: orgId,
      name: orgId,
      displayName: orgId,
      icon: Users,
      emoji: '👥',
      color: {
        bg: 'bg-gray-50',
        text: 'text-gray-900',
        border: 'border-gray-400',
        light: 'bg-gray-100',
        dark: 'bg-gray-600',
        gradient: 'from-gray-500 to-gray-700',
      },
    }
  );
}

export function getOrganizationColor(orgId: string): string {
  const theme = getOrganizationTheme(orgId);
  return theme.color.dark;
}

export function getOrganizationIcon(orgId: string): LucideIcon {
  const theme = getOrganizationTheme(orgId);
  return theme.icon;
}

export function getOrganizationEmoji(orgId: string): string {
  const theme = getOrganizationTheme(orgId);
  return theme.emoji;
}

export const ORGANIZATIONS_ORDER = [
  'bispado',
  'secretario',
  'elderes',
  'rapazes',
  'mocas',
  'socorro',
  'primaria',
  'escolaDominical',
  'missionaria',
  'temploHistoriaFamilia',
];
