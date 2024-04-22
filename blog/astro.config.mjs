import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog';

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: 'https://opensaas.sh',
  integrations: [
    starlightBlog({
      title: 'Blog',
      customCss: ['./src/styles/tailwind.css'],
      authors: {
        vince: {
          name: 'Vince',
          title: 'Dev Rel @ Wasp',
          picture: '/CRAIG_ROCK.png',
          // Images in the `public` directory are supported.
          url: 'https://wasp-lang.dev',
        },
      },
    }),
    starlight({
      title: 'Your SaaS',
      customCss: ['./src/styles/tailwind.css'],
      description: 'Documentation for your SaaS.',
      logo: {
        src: '/src/assets/logo.png',
        alt: 'Your SaaS',
      },
      head: [
        // Add your script tags here. Below is an example for Google analytics, etc.
        {
          tag: 'script',
          attrs: {
            src: 'https://www.googletagmanager.com/gtag/js?id=<YOUR-GOOGLE-ANALYTICS-ID>',
          },
        },
        {
          tag: 'script',
          content: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
        
          gtag('config', '<YOUR-GOOGLE-ANALYTICS-ID>');
          `,
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/<your-repo>',
      },
      components: {
        SiteTitle: './src/components/MyHeader.astro',
        MarkdownContent: 'starlight-blog/overrides/MarkdownContent.astro',
        Sidebar: 'starlight-blog/overrides/Sidebar.astro',
        // ThemeSelect: 'starlight-blog/overrides/ThemeSelect.astro',
      },

      social: {
        github: 'https://github.com/wasp-lang/open-saas',
        twitter: 'https://twitter.com/wasp_lang',
        discord: 'https://discord.gg/aCamt5wCpS',
      },
      sidebar: [
        {
          label: 'Start Here',
          items: [
            {
              label: 'Introduction',
              link: '/',
            },
          ],
        },
        {
          label: 'Guides',
          items: [
            {
              label: 'Example Guide',
              link: '/guides/example/',
            },
          ],
        },
      ],
    }),
    tailwind({ applyBaseStyles: false }),
  ],
});
