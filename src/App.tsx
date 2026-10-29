import { useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import Consent from './components/Consent';
import Analyze from './components/Analyze';
import History from './components/History';
import Profile from './components/Profile';
import Wellness from './components/Wellness';

const CONSENT_KEY = 'dermalyze-consent-v1';

function readConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'yes';
  } catch {
    return false;
  }
}

function saveConsent() {
  try {
    localStorage.setItem(CONSENT_KEY, 'yes');
  } catch {
    /* ignore */
  }
}

type Tab = 'analyze' | 'history' | 'profile' | 'wellness';

function Home({ signOut }: { signOut?: () => void }) {
  const [consented, setConsented]   = useState(readConsent);
  const [tab, setTab]               = useState<Tab>('analyze');
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="app">
      <header className="top">
        <h1>Dermalyze</h1>
        <button className="link" onClick={signOut}>Sign out</button>
      </header>

      {!consented ? (
        <Consent
          onAccept={() => {
            saveConsent();
            setConsented(true);
          }}
        />
      ) : (
        <>
          <nav className="tabs">
            <button
              className={tab === 'analyze' ? 'active' : ''}
              onClick={() => setTab('analyze')}
            >
              Analyze
            </button>
            <button
              className={tab === 'history' ? 'active' : ''}
              onClick={() => setTab('history')}
            >
              History
            </button>
            <button
              className={tab === 'profile' ? 'active' : ''}
              onClick={() => setTab('profile')}
            >
              My skin
            </button>
            <button
              className={tab === 'wellness' ? 'active' : ''}
              onClick={() => setTab('wellness')}
            >
              Wellness
            </button>
          </nav>

          {tab === 'analyze'  && <Analyze  onSaved={() => setRefreshKey((k) => k + 1)} />}
          {tab === 'history'  && <History  refreshKey={refreshKey} />}
          {tab === 'profile'  && <Profile  />}
          {tab === 'wellness' && <Wellness />}
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Authenticator>
      {({ signOut }) => <Home signOut={signOut} />}
    </Authenticator>
  );
}
