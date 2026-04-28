import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { BookOpen, Github } from 'lucide-react';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="font-bold tracking-tight">
          React <span className="text-fd-primary">Zero-UI</span>
        </span>
      ),
    },
    links: [
      {
        icon: <BookOpen />,
        text: 'Docs',
        url: '/docs',
      },
      {
        type: 'icon',
        icon: <Github />,
        text: 'GitHub',
        url: 'https://github.com/react-zero-ui/core',
        external: true,
      },
    ],
  };
}
