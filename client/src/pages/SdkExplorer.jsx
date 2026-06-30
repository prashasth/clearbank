import React, { useState } from 'react';

const SECTIONS = [
  {
    id: 'arch',
    label: 'Architecture',
    icon: '🏗️',
  },
  {
    id: 'frontend',
    label: 'Frontend SDK',
    icon: '⚛️',
  },
  {
    id: 'backend',
    label: 'Backend SDK',
    icon: '🖥️',
  },
  {
    id: 'files',
    label: 'File Map',
    icon: '📂',
  },
];

const ARCH_NODES = [
  {
    layer: 'Browser',
    color: '#e0f2fe',
    border: '#0284c7',
    items: [
      { name: '@descope/react-sdk', desc: 'AuthProvider, useSession, useUser, useDescope, <Descope> widget' },
      { name: 'DS cookie', desc: 'Short-lived session JWT set automatically by Descope SDK' },
      { name: 'DSR cookie', desc: 'Long-lived refresh token — silently renews DS' },
    ],
  },
  {
    layer: 'Express Server',
    color: '#f0fdf4',
    border: '#16a34a',
    items: [
      { name: '@descope/node-sdk', desc: 'client.validateSession() — verifies DS on every protected route' },
      { name: 'Management API', desc: 'Import users, check accounts, verify flows, get password policy' },
      { name: 'descopeClient.js', desc: 'Singleton SDK instance, initialised with Project ID + Management Key' },
    ],
  },
  {
    layer: 'Descope Cloud',
    color: '#fdf4ff',
    border: '#9333ea',
    items: [
      { name: 'Flows', desc: 'sign-up-or-in-bank, step-up-passkeys-or-magic-link' },
      { name: 'User Store', desc: 'Joel, Alex, Vicky, Jane, Bill, Beth, Mike — all identities live here' },
      { name: 'Audit Logs', desc: 'Every auth event captured — streamed to Honeycomb via OTEL' },
    ],
  },
];

const FRONTEND_SNIPPETS = [
  {
    title: 'Wrap the app — AuthProvider',
    file: 'client/src/context/AuthContext.jsx',
    lines: '62–74',
    desc: 'One provider wraps the entire app. Switches between real Descope mode and local mock mode based on whether VITE_DESCOPE_PROJECT_ID is set.',
    code: `import { AuthProvider as DescopeAuthProvider,
  useDescope, useSession, useUser
} from '@descope/react-sdk';

export function AuthProvider({ children }) {
  const projectId = import.meta.env.VITE_DESCOPE_PROJECT_ID;

  if (!projectId) {
    return <MockAuthProvider>{children}</MockAuthProvider>;
  }
  return (
    <DescopeAuthProvider projectId={projectId}>
      <DescopeInnerProvider>{children}</DescopeInnerProvider>
    </DescopeAuthProvider>
  );
}`,
  },
  {
    title: 'Read session state — useSession, useUser',
    file: 'client/src/context/AuthContext.jsx',
    lines: '34–58',
    desc: 'Three hooks give you everything: is the user logged in, their profile, and the raw session token to send to the backend.',
    code: `function DescopeInnerProvider({ children }) {
  const { isAuthenticated, isSessionLoading,
          sessionToken } = useSession();
  const { user, isUserLoading } = useUser();
  const { logout: descopeLogout } = useDescope();

  // sessionToken is the DS cookie value —
  // passed to backend on every API call
  return (
    <AuthContext.Provider value={{
      user, sessionToken, isAuthenticated,
      isLoading: isSessionLoading || isUserLoading,
      logout: descopeLogout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}`,
  },
  {
    title: 'Render the login flow — <Descope>',
    file: 'client/src/components/DescopeAuthWidget.jsx',
    lines: '45–49',
    desc: 'The entire login UI — email, passkey, magic link, password — is one component. flowId drives which Descope flow runs.',
    code: `import { Descope } from '@descope/react-sdk';

<Descope
  flowId={flowId}          // VITE_FLOW_ID from .env
  onSuccess={handleSuccess} // receives sessionJwt + user
  onError={handleError}
/>`,
  },
  {
    title: 'Step-up challenge mid-session',
    file: 'client/src/components/StepUpWidget.jsx',
    lines: '42–47',
    desc: 'Same <Descope> component, different flowId. Fires as a modal when a transfer exceeds ₱50,000 — user must re-verify before the transfer proceeds.',
    code: `<Descope
  flowId={flowId}  // VITE_STEPUP_FLOW_ID
  onSuccess={handleSuccess}
  onError={handleError}
/>

// Triggered in Transfer.jsx when amount > 50000`,
  },
];

const BACKEND_SNIPPETS = [
  {
    title: 'Initialise the SDK',
    file: 'server/lib/descopeClient.js',
    lines: '1–21',
    desc: 'Singleton pattern — one SDK instance shared across all routes. Reinitialises automatically when the Management Key changes via the wizard.',
    code: `const DescopeClient = require('@descope/node-sdk');

let _client = null;

function getClient() {
  const projectId = process.env.VITE_DESCOPE_PROJECT_ID;
  const managementKey = process.env.DESCOPE_MANAGEMENT_KEY;

  if (!projectId || !managementKey) return null;

  if (!_client) {
    _client = DescopeClient({ projectId, managementKey });
  }
  return _client;
}`,
  },
  {
    title: 'Validate session on every request',
    file: 'server/routes/auth.js',
    lines: '78–90',
    desc: 'Every protected API call passes the DS cookie. validateSession() verifies the JWT signature against Descope — if the session was revoked, this throws immediately.',
    code: `router.post('/session', async (req, res) => {
  const { sessionToken } = req.body;
  const client = getClient();

  // Throws if token is invalid or revoked
  const result = await client.validateSession(sessionToken);

  return res.json({
    success: true,
    data: result?.token  // decoded JWT payload
  });
});`,
  },
  {
    title: 'Import users via Management API',
    file: 'server/routes/auth.js',
    lines: '~160–200',
    desc: 'Used in M1 to bulk-import legacy accounts (Joel, Alex, Vicky) with hashed passwords, and M2 to import new customers (Jane, Bill, Beth) without credentials.',
    code: `const client = getClient();

// Create user with password (M1 — legacy accounts)
await client.management.user.create(
  email,
  { displayName, loginIds: [email] }
);
await client.management.user.setPassword(email, password);

// Create user without credentials (M2 — new customers)
await client.management.user.create(
  email,
  { displayName, loginIds: [email] }
);`,
  },
  {
    title: 'Verify a flow exists',
    file: 'server/routes/auth.js',
    lines: '~185–195',
    desc: 'Wizard verification steps — backend checks that the flow ID the attendee pasted actually exists in their Descope project before marking the step complete.',
    code: `const client = getClient();

const flow = await client.management.flow.export(flowId);

if (!flow?.flow) {
  return res.json({
    success: false,
    error: \`Flow "\${flowId}" not found in your project\`
  });
}

return res.json({ success: true });`,
  },
];

const FILE_MAP = [
  {
    path: 'client/src/context/AuthContext.jsx',
    role: 'Core auth state',
    descope: ['AuthProvider (DescopeAuthProvider)', 'useSession', 'useUser', 'useDescope'],
    color: '#e0f2fe',
    dot: '#0284c7',
  },
  {
    path: 'client/src/components/DescopeAuthWidget.jsx',
    role: 'Login UI',
    descope: ['<Descope flowId={VITE_FLOW_ID}>'],
    color: '#e0f2fe',
    dot: '#0284c7',
  },
  {
    path: 'client/src/components/StepUpWidget.jsx',
    role: 'Step-up challenge modal',
    descope: ['<Descope flowId={VITE_STEPUP_FLOW_ID}>'],
    color: '#e0f2fe',
    dot: '#0284c7',
  },
  {
    path: 'client/src/components/ProtectedRoute.jsx',
    role: 'Route guard',
    descope: ['useAuth() → isAuthenticated'],
    color: '#e0f2fe',
    dot: '#0284c7',
  },
  {
    path: 'server/lib/descopeClient.js',
    role: 'SDK singleton',
    descope: ['DescopeClient({ projectId, managementKey })'],
    color: '#f0fdf4',
    dot: '#16a34a',
  },
  {
    path: 'server/routes/auth.js',
    role: 'All verify endpoints',
    descope: ['validateSession()', 'management.user.create()', 'management.user.setPassword()', 'management.flow.export()'],
    color: '#f0fdf4',
    dot: '#16a34a',
  },
  {
    path: 'server/routes/env.js',
    role: 'Env management',
    descope: ['resetClient() — reinitialises SDK when keys change'],
    color: '#f0fdf4',
    dot: '#16a34a',
  },
  {
    path: '.env',
    role: 'Config',
    descope: ['VITE_DESCOPE_PROJECT_ID', 'DESCOPE_MANAGEMENT_KEY', 'VITE_FLOW_ID', 'VITE_STEPUP_FLOW_ID'],
    color: '#fdf4ff',
    dot: '#9333ea',
  },
];

export default function SdkExplorer() {
  const [section, setSection] = useState('arch');
  const [openSnippet, setOpenSnippet] = useState(0);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.logo}>CB</div>
        <div>
          <h1 style={S.title}>Descope SDK Explorer</h1>
          <p style={S.subtitle}>How ClearBank integrates Descope — frontend, backend & architecture</p>
        </div>
      </div>

      <div style={S.tabs}>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            style={{ ...S.tab, ...(section === s.id ? S.tabActive : {}) }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {section === 'arch' && (
        <div>
          <p style={S.intro}>Three layers, each talking to Descope differently. The browser uses the React SDK for UI and session state. The server uses the Node SDK to validate tokens and manage users. Descope Cloud is the source of truth for identity, flows, and audit logs.</p>
          {ARCH_NODES.map(layer => (
            <div key={layer.layer} style={{ ...S.archLayer, background: layer.color, border: `1.5px solid ${layer.border}` }}>
              <div style={{ ...S.layerLabel, color: layer.border }}>{layer.layer}</div>
              <div style={S.archGrid}>
                {layer.items.map(item => (
                  <div key={item.name} style={S.archCard}>
                    <div style={S.archName}>{item.name}</div>
                    <div style={S.archDesc}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div style={S.archFlow}>
            <span style={S.flowStep}>User visits /login</span>
            <span style={S.arrow}>→</span>
            <span style={S.flowStep}>Descope flow renders</span>
            <span style={S.arrow}>→</span>
            <span style={S.flowStep}>DS + DSR cookies set</span>
            <span style={S.arrow}>→</span>
            <span style={S.flowStep}>Backend validates DS on every request</span>
            <span style={S.arrow}>→</span>
            <span style={S.flowStep}>Revoke in console → instant logout</span>
          </div>
        </div>
      )}

      {section === 'frontend' && (
        <div>
          <p style={S.intro}>The React SDK handles all auth state and renders the Descope flow widget. No custom login forms, no token management — just hooks and one component.</p>
          <div style={S.snippetList}>
            {FRONTEND_SNIPPETS.map((s, i) => (
              <div key={i} style={S.snippetCard}>
                <button style={S.snippetHeader} onClick={() => setOpenSnippet(openSnippet === i ? -1 : i)}>
                  <div>
                    <div style={S.snippetTitle}>{s.title}</div>
                    <div style={S.snippetMeta}>{s.file} · line {s.lines}</div>
                  </div>
                  <span style={S.chevron}>{openSnippet === i ? '▲' : '▼'}</span>
                </button>
                {openSnippet === i && (
                  <div style={S.snippetBody}>
                    <p style={S.snippetDesc}>{s.desc}</p>
                    <pre style={S.code}>{s.code}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'backend' && (
        <div>
          <p style={S.intro}>The Node SDK does two things: validates session tokens server-side on every protected request, and calls the Management API to import users, check accounts, and verify flows.</p>
          <div style={S.snippetList}>
            {BACKEND_SNIPPETS.map((s, i) => (
              <div key={i} style={S.snippetCard}>
                <button style={S.snippetHeader} onClick={() => setOpenSnippet(openSnippet === i ? -1 : i)}>
                  <div>
                    <div style={S.snippetTitle}>{s.title}</div>
                    <div style={S.snippetMeta}>{s.file} · line {s.lines}</div>
                  </div>
                  <span style={S.chevron}>{openSnippet === i ? '▲' : '▼'}</span>
                </button>
                {openSnippet === i && (
                  <div style={S.snippetBody}>
                    <p style={S.snippetDesc}>{s.desc}</p>
                    <pre style={S.code}>{s.code}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'files' && (
        <div>
          <p style={S.intro}>Every file that touches Descope — and exactly which SDK calls or hooks it uses.</p>
          <div style={S.legend}>
            <span style={{ ...S.dot, background: '#0284c7' }} /> Frontend (React SDK)
            <span style={{ ...S.dot, background: '#16a34a', marginLeft: 16 }} /> Backend (Node SDK)
            <span style={{ ...S.dot, background: '#9333ea', marginLeft: 16 }} /> Config
          </div>
          {FILE_MAP.map(f => (
            <div key={f.path} style={{ ...S.fileCard, borderLeft: `4px solid ${f.dot}` }}>
              <div style={S.fileTop}>
                <code style={S.filePath}>{f.path}</code>
                <span style={{ ...S.fileRole, color: f.dot }}>{f.role}</span>
              </div>
              <div style={S.tagRow}>
                {f.descope.map(tag => (
                  <span key={tag} style={{ ...S.tag, background: f.color, color: f.dot }}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const S = {
  page: { maxWidth: 860, margin: '0 auto', padding: '32px 24px', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 },
  logo: { width: 44, height: 44, borderRadius: 10, background: '#0d3b8e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 },
  title: { margin: 0, fontSize: 22, fontWeight: 700, color: '#0d3b8e' },
  subtitle: { margin: '4px 0 0', fontSize: 14, color: '#64748b' },
  tabs: { display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' },
  tab: { padding: '8px 18px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#475569' },
  tabActive: { background: '#0d3b8e', color: '#fff', border: '1.5px solid #0d3b8e' },
  intro: { fontSize: 15, color: '#475569', lineHeight: 1.6, marginBottom: 24 },

  archLayer: { borderRadius: 12, padding: '16px 20px', marginBottom: 16 },
  layerLabel: { fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 },
  archGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 },
  archCard: { background: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '10px 14px' },
  archName: { fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 },
  archDesc: { fontSize: 12, color: '#64748b', lineHeight: 1.5 },
  archFlow: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 24, padding: '16px 20px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' },
  flowStep: { fontSize: 12, fontWeight: 500, color: '#334155', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px' },
  arrow: { color: '#94a3b8', fontSize: 14 },

  snippetList: { display: 'flex', flexDirection: 'column', gap: 10 },
  snippetCard: { border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' },
  snippetHeader: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#f8fafc', cursor: 'pointer', border: 'none', textAlign: 'left' },
  snippetTitle: { fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 3 },
  snippetMeta: { fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' },
  chevron: { fontSize: 11, color: '#94a3b8' },
  snippetBody: { padding: '16px 18px', background: '#fff', borderTop: '1px solid #e2e8f0' },
  snippetDesc: { fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 14 },
  code: { background: '#0f172a', color: '#e2e8f0', borderRadius: 8, padding: '14px 16px', fontSize: 12, lineHeight: 1.6, overflowX: 'auto', margin: 0 },

  legend: { fontSize: 13, color: '#64748b', marginBottom: 16, display: 'flex', alignItems: 'center', flexWrap: 'wrap' },
  dot: { display: 'inline-block', width: 10, height: 10, borderRadius: '50%', marginRight: 6 },
  fileCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px', marginBottom: 10 },
  fileTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 4 },
  filePath: { fontSize: 13, fontWeight: 600, color: '#1e293b', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 },
  fileRole: { fontSize: 12, fontWeight: 600 },
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  tag: { fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 6 },
};
