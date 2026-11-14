//-----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
//        Copyright (c) Microsoft Corporation.  All rights reserved.
//        Licensed under the MIT license. See LICENSE file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

import { useState } from 'react';

// The logo must be a static asset served by the app itself (packages/frontend/
// public/Images/Logo.svg), so BASE_URL resolves it in dev and in the Fabric-
// hosted build alike. A OneLake/Lakehouse Files URL cannot be used here: those
// endpoints require a Storage-audience bearer token, which an <img> can't send.
const logoSrc = `${import.meta.env.BASE_URL}Images/Logo.svg`;

export function TopNav() {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-50 flex h-14 w-full items-center justify-start px-4 md:px-6"
      style={{
        background:
          'linear-gradient(90deg, rgba(0,0,33,1) 0%, rgba(0,89,120,1) 100%)',
      }}
    >
      <a href={import.meta.env.BASE_URL} className="flex items-center">
        {logoFailed ? (
          // Text lockup so the nav is never blank if the asset is missing.
          <span className="font-heading text-400 font-semibold tracking-wide text-[#ecebe6]">
            Data<span className="text-[#8fe3ea]"> Control Tower</span>
          </span>
        ) : (
          <img
            src={logoSrc}
            alt="Data Control Tower"
            className="h-8 w-auto"
            onError={() => setLogoFailed(true)}
          />
        )}
      </a>
    </nav>
  );
}
