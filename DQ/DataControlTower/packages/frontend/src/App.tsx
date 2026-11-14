//-----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
//        Copyright (c) Microsoft Corporation.  All rights reserved.
//        Licensed under the MIT license. See LICENSE file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

import { SideNav } from './components/side-nav.component';
import { TopNav } from './components/top-nav.component';
import { DqHome } from './home/DqHome';
import { useHashRoute } from './hooks/use-hash-route';
import { SettingsPage } from './settings/SettingsPage';

function App() {
  const { route } = useHashRoute();

  return (
    <>
      <TopNav />
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col md:flex-row">
        <SideNav current={route} />
        <div className="min-w-0 flex-1">
          {route === 'settings' ? <SettingsPage /> : <DqHome />}
        </div>
      </div>
    </>
  );
}

export default App;
