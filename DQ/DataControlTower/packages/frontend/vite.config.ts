//-----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
//        Copyright (c) Microsoft Corporation.  All rights reserved.
//        Licensed under the MIT license. See LICENSE file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

import react from '@vitejs/plugin-react';
import { rayfinLocalDev } from '@microsoft/rayfin-local-dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, transformWithEsbuild, type PluginOption } from 'vite';
import license from 'rollup-plugin-license';

import { resolve } from 'path';

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname;

// Dev-only middleware: makes the local Vite server compatible with browsers that
// enforce Local Network Access (LNA) checks when a public origin (the Fabric portal)
// embeds an iframe pointing at http://localhost. Sets the LNA opt-in response header
// on every response and short-circuits the corresponding preflight OPTIONS request.
// This is required for fetch/XHR subresources from the embedded app — top-level
// iframe navigations additionally require launching Chromium with the
// `--disable-features=...LocalNetworkAccessChecks` flag (a browser flag your test tooling must set).
const localNetworkAccessPlugin: PluginOption = {
  name: 'local-network-access-headers',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
      if (
        req.method === 'OPTIONS' &&
        req.headers['access-control-request-private-network']
      ) {
        const origin = req.headers.origin || '*';
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader(
          'Access-Control-Allow-Headers',
          req.headers['access-control-request-headers'] || '*'
        );
        res.statusCode = 204;
        res.end();
        return;
      }
      next();
    });
  },
};

// Vite 8 compiles TS with Oxc, which does not lower TC39 Stage 3 decorators
// (used by Rayfin entities such as rayfin/connectors/**). Left as-is, raw
// `@entity()` syntax ends up in the bundle and browsers can't parse it.
// Pre-transform decorator-bearing TS files with esbuild so they're lowered.
const lowerDecoratorsPlugin: PluginOption = {
  name: 'rayfin-lower-tc39-decorators',
  enforce: 'pre',
  async transform(code, id) {
    if (!/\.tsx?$/.test(id) || id.includes('node_modules')) return null;
    if (!/^\s*@[A-Za-z_$]/m.test(code)) return null;
    const result = await transformWithEsbuild(code, id, {
      loader: id.endsWith('x') ? 'tsx' : 'ts',
      target: 'es2022',
      jsx: 'automatic',
      sourcemap: true,
    });
    return { code: result.code, map: result.map };
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    lowerDecoratorsPlugin,
    react(),
    tailwindcss(),
    rayfinLocalDev({ autoLogin: true }),
    localNetworkAccessPlugin,
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src'),
    },
    // Capability packages are linked during monorepo development. Force their
    // React imports onto the app's instance so production builds cannot bundle
    // a second dispatcher and fail hooks at runtime.
    dedupe: ['react', 'react-dom'],
  },
  // Rayfin entities use TC39 Stage 3 decorators; an ES2022 target makes the
  // transformer lower them instead of emitting raw `@decorator` syntax.
  esbuild: {
    target: 'es2022',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2022',
    },
  },
  build: {
    target: 'es2022',
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      plugins: [
        license({
          thirdParty: {
            multipleVersions: true,
            output: {
              file: resolve(projectRoot, 'dist', 'THIRD_PARTY_NOTICES.txt'),
              template(dependencies) {
                if (dependencies.length === 0) {
                  return 'No third-party dependencies.';
                }
                return (
                  'This file was auto-generated at build time.\n\n' +
                  dependencies
                    .map((dep) => {
                      const lines = [
                        `${dep.name}@${dep.version}`,
                        `License: ${dep.license || 'UNKNOWN'}`,
                      ];
                      if (dep.author) {
                        lines.push(
                          `Author: ${typeof dep.author === 'string' ? dep.author : dep.author.text()}`
                        );
                      }
                      if (dep.noticeText) {
                        lines.push('', 'NOTICE:', dep.noticeText.trim());
                      }
                      if (dep.licenseText) {
                        lines.push('', dep.licenseText.trim());
                      }
                      return lines.join('\n');
                    })
                    .join('\n\n' + '='.repeat(60) + '\n\n')
                );
              },
            },
          },
        }),
      ],
    },
  },
});
