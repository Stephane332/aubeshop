/**
 * app/+html.tsx
 * =============
 * Enveloppe HTML de la version web, et déclaration de la PWA.
 *
 * Ce fichier n'est utilisé qu'au rendu web : c'est lui qui rattache le
 * manifeste, la couleur de thème et le service worker, donc ce qui rend
 * AubeShop installable depuis un navigateur.
 */

import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* `viewport-fit=cover` permet d'occuper les encoches sur iOS ;
            les zones sûres sont gérées par le composant Screen. */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        <title>AubeShop — Marketplace du campus</title>
        <meta
          name="description"
          content="Achetez et vendez facilement sur le campus de l'Université Aube Nouvelle. Vendeurs étudiants vérifiés, livraison à Ouagadougou et Bobo-Dioulasso."
        />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="AubeShop" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* La couleur de la barre du navigateur suit le thème du système. */}
        <meta name="theme-color" content="#C81E3C" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0D0D10" media="(prefers-color-scheme: dark)" />

        {/* Partage */}
        <meta property="og:title" content="AubeShop — Marketplace du campus" />
        <meta
          property="og:description"
          content="Achetez et vendez facilement sur le campus de l'Université Aube Nouvelle."
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/icons/icon-512.png" />

        {/*
          Désactive le défilement élastique du body : sans cela, les
          ScrollView de l'app et celui du document défilent ensemble.
        */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: BASE_STYLE }} />
        <script dangerouslySetInnerHTML={{ __html: REGISTER_SW }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

/**
 * Fond appliqué avant l'hydratation de React. Sans lui, un éclair blanc
 * apparaît au chargement en thème sombre.
 */
const BASE_STYLE = `
  :root { color-scheme: light dark; }
  body { background-color: #F6F6F8; overscroll-behavior-y: none; }
  @media (prefers-color-scheme: dark) {
    body { background-color: #0D0D10; }
  }
  /* Supprime le surlignage bleu au tap sur mobile. */
  * { -webkit-tap-highlight-color: transparent; }
`;

/**
 * Enregistrement du service worker.
 *
 * Après le chargement complet, pour ne pas disputer la bande passante aux
 * ressources de la première page — ce qui compte sur un réseau lent.
 */
const REGISTER_SW = `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {
        // Sans service worker l'app reste pleinement fonctionnelle,
        // simplement non installable et sans mode hors connexion.
      });
    });
  }
`;
