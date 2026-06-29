const fse = require('fs-extra');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const INBOX_PATH = path.join(DATA_DIR, 'inbox.json');

async function readInbox() {
  await fse.ensureDir(DATA_DIR);
  if (!await fse.pathExists(INBOX_PATH)) {
    await fse.writeJson(INBOX_PATH, [], { spaces: 2 });
    return [];
  }
  return fse.readJson(INBOX_PATH);
}

async function writeInbox(inbox) {
  await fse.ensureDir(DATA_DIR);
  await fse.writeJson(INBOX_PATH, inbox, { spaces: 2 });
}

async function resetInbox() {
  await fse.ensureDir(DATA_DIR);
  await fse.writeJson(INBOX_PATH, [], { spaces: 2 });
}

function deriveAdminEmail(baseEmail) {
  return baseEmail.replace('@', '+admin@');
}

const EMAIL_TEMPLATES = {
  'M1-trigger': (baseEmail, wizardUrl) => ({
    id: 'm1-trigger',
    missionId: 'M1',
    type: 'trigger',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M1] Action Required: Legacy User Account Migration — AFASA Compliance Deadline',
    body: `<p>Dear IT Operations,</p>
<p>As part of ClearBank's obligations under the AFASA Digital Banking Security Framework, we are required to migrate all legacy user accounts to our new identity platform by the end of this compliance cycle.</p>
<p>AFASA Article 3 mandates that all financial institutions maintain verified, centralized identity records for all active customers. Our current fragmented account structure does not meet this requirement.</p>
<p><strong>Your immediate action is required:</strong></p>
<ol>
  <li>Obtain the Management API key from your Descope project settings</li>
  <li>Import the following legacy accounts: Joel, Alex, and Vicky</li>
  <li>Verify all three accounts have been successfully migrated</li>
</ol>
<p>Please use the Mission Wizard to complete this task: <a href="${wizardUrl}">${wizardUrl}</a></p>
<p>Failure to comply before the deadline will result in a regulatory incident report.</p>
<p>Regards,<br>Sarah Chen<br>Chief Information Security Officer<br>ClearBank Philippines</p>`
  }),
  'M2-trigger': (baseEmail, wizardUrl) => ({
    id: 'm2-trigger',
    missionId: 'M2',
    type: 'trigger',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M2] Action Required: Onboarding of Invited Customer Accounts — Pending Activation',
    body: `<p>Dear IT Operations,</p>
<p>Three new customer accounts have been approved for onboarding under AFASA Article 4 (New Customer Verification). These accounts must be imported into the identity store — they will be able to authenticate once a passwordless flow is configured.</p>
<p><strong>Accounts to import:</strong> Jane, Bill, and Beth</p>
<p>Please complete this via the Mission Wizard: <a href="${wizardUrl}">${wizardUrl}</a></p>
<p>Regards,<br>Sarah Chen<br>CISO, ClearBank Philippines</p>`
  }),
  'M3-trigger': (baseEmail, wizardUrl) => ({
    id: 'm3-trigger',
    missionId: 'M3',
    type: 'trigger',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M3] Notice: Legacy Authentication Flow Required — Interim Measure Only',
    body: `<p>Dear IT Operations,</p>
<p>As an interim measure while we prepare our passwordless infrastructure, AFASA requires that we activate a functional authentication flow for our customer portal. You are directed to configure a password-based login flow in Descope and connect it to the ClearBank application.</p>
<p>This is a temporary measure. Passwordless migration will follow in Mission 4.</p>
<p>Wizard: <a href="${wizardUrl}">${wizardUrl}</a></p>
<p>Regards,<br>Sarah Chen<br>CISO, ClearBank Philippines</p>`
  }),
  'M4-trigger': (baseEmail, wizardUrl) => ({
    id: 'm4-trigger',
    missionId: 'M4',
    type: 'trigger',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M4] Directive: Passkey Enrollment for Legacy Accounts — AFASA Phase 1 Migration',
    body: `<p>Dear IT Operations,</p>
<p>AFASA Article 5 mandates phishing-resistant authentication for all customer accounts. We are now beginning the passkey migration. Joel's account must be enrolled with a passkey credential as our first migration target.</p>
<p>Configure a passkey-enabled flow and verify Joel's enrollment via the wizard.</p>
<p>Wizard: <a href="${wizardUrl}">${wizardUrl}</a></p>
<p>Regards,<br>Sarah Chen<br>CISO, ClearBank Philippines</p>`
  }),
  'M5-trigger': (baseEmail, wizardUrl) => ({
    id: 'm5-trigger',
    missionId: 'M5',
    type: 'trigger',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M5] Directive: Passwordless Self-Service Onboarding — New Customer Sign-Up Flow',
    body: `<p>Dear IT Operations,</p>
<p>Following the successful import of pre-invited customers (Jane, Bill, Beth) into our identity store, we must now validate that new customers can self-onboard without a password per AFASA Article 5.</p>
<p>Configure a passwordless sign-up flow (magic link or passkey) and verify end-to-end that a brand-new customer account can be created and authenticated without ever setting a password.</p>
<p>Note: The pre-imported accounts (Jane, Bill, Beth) demonstrate our bulk identity import capability — a separate AFASA Article 4 control. This mission focuses on the self-service onboarding path for net-new customers arriving via our public portal.</p>
<p>Wizard: <a href="${wizardUrl}">${wizardUrl}</a></p>
<p>Regards,<br>Sarah Chen<br>CISO, ClearBank Philippines</p>`
  }),
  'M6-trigger': (baseEmail, wizardUrl) => ({
    id: 'm6-trigger',
    missionId: 'M6',
    type: 'trigger',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M6] Directive: Password Policy Enforcement and Breach Credential Detection',
    body: `<p>Dear IT Operations,</p>
<p>A security audit has identified that our password policy does not meet AFASA minimum requirements. Effective immediately, enforce: minimum 10 characters, uppercase, number, and special character requirements. Additionally, enable breach credential detection and remove the compromised account identified in our threat intelligence feed.</p>
<p>Wizard: <a href="${wizardUrl}">${wizardUrl}</a></p>
<p>Regards,<br>Sarah Chen<br>CISO, ClearBank Philippines</p>`
  }),
  'M1-complete': (baseEmail, wizardUrl) => ({
    id: 'm1-complete',
    missionId: 'M1',
    type: 'completion',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M1] Confirmed: Legacy Account Migration Complete — AFASA Article 3 Closed',
    body: `<p>Dear IT Operations,</p>
<p>I am pleased to confirm that the legacy account migration required under AFASA Article 3 has been completed successfully.</p>
<p>The following accounts have been migrated to the Descope identity store and are now active:</p>
<ul>
  <li>Joel — legacy customer</li>
  <li>Alex — legacy customer</li>
  <li>Vicky — legacy customer</li>
</ul>
<p>ClearBank's obligation under AFASA Article 3 (Centralised Identity Management) is fulfilled for this cohort. All authentication events for these accounts are now recorded in Descope's audit trail.</p>
<p><strong>Next action required:</strong> Proceed to Mission 2 — onboarding of invited new customer accounts. Instructions are attached in the following directive.</p>
<p>Wizard: <a href="${wizardUrl}">${wizardUrl}</a></p>
<p>Regards,<br>Sarah Chen<br>Chief Information Security Officer<br>ClearBank Philippines</p>`
  }),
  'M2-complete': (baseEmail, wizardUrl) => ({
    id: 'm2-complete',
    missionId: 'M2',
    type: 'completion',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M2] Confirmed: New Customer Accounts Imported — AFASA Article 4 Pending Activation',
    body: `<p>Dear IT Operations,</p>
<p>The three new customer accounts (Jane, Bill, and Beth) have been successfully imported into the Descope identity store, in compliance with AFASA Article 4 (New Customer Verification).</p>
<p>These accounts are active in the system but have no authentication credentials yet — they cannot log in until a passwordless flow is configured for them in M5.</p>
<p>AFASA Article 4 compliance is acknowledged. Proceed to M3 — configuring the authentication flow for our legacy customer accounts.</p>
<p>Wizard: <a href="${wizardUrl}">${wizardUrl}</a></p>
<p>Regards,<br>Sarah Chen<br>Chief Information Security Officer<br>ClearBank Philippines</p>`
  }),
  'M3-complete': (baseEmail, wizardUrl) => ({
    id: 'm3-complete',
    missionId: 'M3',
    type: 'completion',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M3] Notice: Password Authentication Active — Interim Measure Only',
    body: `<p>Dear IT Operations,</p>
<p>The password-based authentication flow is now active and connected to the ClearBank customer portal. Legacy accounts (Joel, Alex, Vicky) can now authenticate.</p>
<p>I must stress: this is an <strong>interim measure only</strong>. AFASA Article 5 requires a transition to phishing-resistant authentication. Passwords are a temporary bridge — not our final state.</p>
<p>The AFASA compliance timeline requires passkey migration to begin immediately. Proceed to Mission 4 — passkey enrollment for legacy accounts.</p>
<p>Wizard: <a href="${wizardUrl}">${wizardUrl}</a></p>
<p>Regards,<br>Sarah Chen<br>Chief Information Security Officer<br>ClearBank Philippines</p>`
  }),
  'M4-complete': (baseEmail, wizardUrl) => ({
    id: 'm4-complete',
    missionId: 'M4',
    type: 'completion',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M4] Confirmed: Passkey Enrolled for Joel — AFASA Article 5 Phase 1 Complete',
    body: `<p>Dear IT Operations,</p>
<p>Joel's account has been successfully migrated to passkey-based authentication. The WebAuthn credential has been verified in the Descope identity store.</p>
<p>This marks the completion of <strong>AFASA Article 5 Phase 1</strong> — phishing-resistant authentication for our first legacy user cohort. Joel can now authenticate without a password, eliminating credential theft risk for his account.</p>
<p>Phase 2 requires the same standard to be applied to our new customer accounts (Jane, Bill, Beth). Proceed to Mission 5 — passwordless onboarding for new arrivals.</p>
<p>Wizard: <a href="${wizardUrl}">${wizardUrl}</a></p>
<p>Regards,<br>Sarah Chen<br>Chief Information Security Officer<br>ClearBank Philippines</p>`
  }),
  'M5-complete': (baseEmail, wizardUrl) => ({
    id: 'm5-complete',
    missionId: 'M5',
    type: 'completion',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M5] Confirmed: Passwordless Self-Registration Verified — AFASA Article 5 Phase 2 Complete',
    body: `<p>Dear IT Operations,</p>
<p>A brand-new customer has successfully self-registered through our passwordless onboarding flow — no password was set at any point. The customer signed up via magic link, enrolled a passkey, and authenticated on the next login using that passkey alone.</p>
<p><strong>AFASA Article 5 Phase 2 is complete.</strong> Our public portal now supports fully passwordless self-registration. New customers are enrolled on a phishing-resistant authentication path from day one — they will never know what a password is in the context of ClearBank.</p>
<p>This represents a significant compliance milestone. However, our obligations under AFASA Article 6 remain outstanding. Threat intelligence has flagged a potential breach exposure in our password sign-up path. Proceed to Mission 6 — breach credential detection.</p>
<p>Wizard: <a href="${wizardUrl}">${wizardUrl}</a></p>
<p>Regards,<br>Sarah Chen<br>Chief Information Security Officer<br>ClearBank Philippines</p>`
  }),
  'M6-complete': (baseEmail, wizardUrl) => ({
    id: 'm6-complete',
    missionId: 'M6',
    type: 'completion',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M6] Confirmed: Password Policy and Breach Detection Active — AFASA Article 6 Closed',
    body: `<p>Dear IT Operations,</p>
<p>I am pleased to confirm that all AFASA Article 6 requirements have been met:</p>
<ul>
  <li><strong>Password policy enforced:</strong> minimum 10 characters, uppercase, number, and special character required on all password-based sign-ups</li>
  <li><strong>Breach credential detection active:</strong> HIBP integration blocks registration with known compromised passwords</li>
  <li><strong>Chris account blocked:</strong> Registration attempt with breached credential "Password123!" was intercepted — no account created</li>
  <li><strong>Mike account active:</strong> Legitimate registration with a strong, clean password succeeded</li>
</ul>
<p>AFASA Article 6 is <strong>closed</strong>. ClearBank's new-customer sign-up path is now hardened against credential stuffing and breach replay attacks.</p>
<p>Proceed to Mission 7 — unified authentication flow consolidation.</p>
<p>Wizard: <a href="${wizardUrl}">${wizardUrl}</a></p>
<p>Regards,<br>Sarah Chen<br>Chief Information Security Officer<br>ClearBank Philippines</p>`
  }),
  'M7-trigger': (baseEmail, wizardUrl) => ({
    id: 'm7-trigger',
    missionId: 'M7',
    type: 'trigger',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M7] Directive: Unified Authentication Flow — All Customer Segments',
    body: `<p>Dear IT Operations,</p>
<p>We are consolidating our authentication flows into a single unified flow that supports all customer segments — legacy password users and new passwordless users alike. Configure this unified flow and update the application accordingly.</p>
<p>Wizard: <a href="${wizardUrl}">${wizardUrl}</a></p>
<p>Regards,<br>Sarah Chen<br>CISO, ClearBank Philippines</p>`
  }),
  'M7-complete': (baseEmail, wizardUrl) => ({
    id: 'm7-complete',
    missionId: 'M7',
    type: 'completion',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M7] Confirmed: Unified Authentication Flow Active — AFASA Article 5 Fully Covered',
    body: `<p>Dear IT Operations,</p>
<p>I am pleased to confirm that the unified authentication flow is now active and serving all customer segments:</p>
<ul>
  <li><strong>Legacy staff</strong> (Joel, Alex, Vicky) — authenticate via passkey</li>
  <li><strong>Imported customers</strong> (Jane, Bill, Beth) — authenticate via passwordless flow</li>
  <li><strong>New sign-ups</strong> — onboarded directly through the unified entry point</li>
</ul>
<p>A single Descope flow now handles all authentication paths. <strong>AFASA Article 5 is fully covered.</strong></p>
<p>Proceed to Mission 8 — geographic access controls per AFASA Article 9.</p>
<p>Wizard: <a href="${wizardUrl}">${wizardUrl}</a></p>
<p>Regards,<br>Sarah Chen<br>Chief Information Security Officer<br>ClearBank Philippines</p>`
  }),
  'M8-trigger': (baseEmail, wizardUrl) => ({
    id: 'm8-trigger',
    missionId: 'M8',
    type: 'trigger',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M8] Directive: Geographic Access Restrictions — AFASA Threat Intelligence Update',
    body: `<p>Dear IT Operations,</p>
<p>AFASA Article 9 requires that financial institutions restrict access from jurisdictions identified as high-risk. Our threat intelligence unit has flagged three countries. You are directed to configure geographic access controls in our authentication flow.</p>
<p>Wizard: <a href="${wizardUrl}">${wizardUrl}</a></p>
<p>Regards,<br>Sarah Chen<br>CISO, ClearBank Philippines</p>`
  }),
  'M8-complete': (baseEmail, wizardUrl) => ({
    id: 'm8-complete',
    missionId: 'M8',
    type: 'completion',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M8] Confirmed: Geographic Access Controls Verified — AFASA Article 9 Closed',
    body: `<p>Dear IT Operations,</p>
<p>Geographic access restrictions have been verified and are now active. AFASA Article 9 compliance is confirmed.</p>
<p>Regards,<br>Sarah Chen<br>CISO, ClearBank Philippines</p>`
  }),
  'M9-trigger': (baseEmail, wizardUrl) => ({
    id: 'm9-trigger',
    missionId: 'M9',
    type: 'trigger',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M9] Directive: Session Validation & Management Controls — AFASA Phase 3',
    body: `<p>Dear IT Operations,</p>
<p>AFASA Article 7 requires active session management. All protected routes must validate session tokens server-side on every request. Additionally, we must demonstrate the ability to revoke active sessions immediately when a threat is detected.</p>
<p>Wizard: <a href="${wizardUrl}">${wizardUrl}</a></p>
<p>Regards,<br>Sarah Chen<br>CISO, ClearBank Philippines</p>`
  }),
  'M9-complete': (baseEmail, wizardUrl) => ({
    id: 'm9-complete',
    missionId: 'M9',
    type: 'completion',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M9] Confirmed: Session Validation & Revocation Verified — AFASA Article 7 Closed',
    body: `<p>Dear IT Operations,</p>
<p>Session validation and revocation controls are confirmed operational. AFASA Article 7 compliance is closed.</p>
<p>Regards,<br>Sarah Chen<br>CISO, ClearBank Philippines</p>`
  }),
  'M10-trigger': (baseEmail, wizardUrl) => ({
    id: 'm10-trigger',
    missionId: 'M10',
    type: 'trigger',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M10] Directive: Step-Up Authentication for High-Value Transactions — AFASA Article 8',
    body: `<p>Dear IT Operations,</p>
<p>AFASA Article 8 mandates step-up authentication for transactions exceeding ₱50,000. Our transfer system must require re-verification for high-value transfers. Configure the step-up flow and integrate it with the Transfer page.</p>
<p>Wizard: <a href="${wizardUrl}">${wizardUrl}</a></p>
<p>Regards,<br>Sarah Chen<br>CISO, ClearBank Philippines</p>`
  }),
  'M10-complete': (baseEmail, wizardUrl) => ({
    id: 'm10-complete',
    missionId: 'M10',
    type: 'completion',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M10] Confirmed: Step-Up Authentication Verified — AFASA Article 8 Closed',
    body: `<p>Dear IT Operations,</p>
<p>Step-up authentication for high-value transactions is confirmed active. AFASA Article 8 compliance is closed.</p>
<p>Regards,<br>Sarah Chen<br>CISO, ClearBank Philippines</p>`
  }),
  'M11-trigger': (baseEmail, wizardUrl) => ({
    id: 'm11-trigger',
    missionId: 'M11',
    type: 'trigger',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M11] Directive: Audit Logging and Compliance Reporting — AFASA Articles 6, 10 and 11',
    body: `<p>Dear IT Operations,</p>
<p>AFASA Articles 6, 10, and 11 require comprehensive audit logging of all authentication events. Descope's built-in audit trail must be connected to our compliance monitoring platform (Honeycomb). This is a cloud-to-cloud integration — no local configuration required beyond enabling the connector.</p>
<p>Wizard: <a href="${wizardUrl}">${wizardUrl}</a></p>
<p>Regards,<br>Sarah Chen<br>CISO, ClearBank Philippines</p>`
  }),
  'M11-complete': (baseEmail, wizardUrl) => ({
    id: 'm11-complete',
    missionId: 'M11',
    type: 'completion',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M11] Confirmed: Audit Logging and Compliance Reporting Verified — AFASA Articles 6, 10 and 11 Closed',
    body: `<p>Dear IT Operations,</p>
<p>The audit pipeline is confirmed live and operational:</p>
<ul>
  <li><strong>Audit streaming active:</strong> All Descope auth events flow to Honeycomb via OpenTelemetry</li>
  <li><strong>Honeycomb board created:</strong> "AFASA Compliance — SecureBank" with 3 compliance queries saved</li>
  <li><strong>Coverage confirmed:</strong> Joel sign-in, step-up events, and auth method breakdown all visible</li>
</ul>
<p><strong>AFASA Articles 6, 10, and 11 are closed.</strong></p>
<p>Proceed to Mission 12 — the final compliance scenario: incident response to a credential stuffing attack.</p>
<p>Wizard: <a href="${wizardUrl}">${wizardUrl}</a></p>
<p>Regards,<br>Sarah Chen<br>Chief Information Security Officer<br>ClearBank Philippines</p>`
  }),
  'M12-trigger': (baseEmail, wizardUrl) => ({
    id: 'm12-trigger',
    missionId: 'M12',
    type: 'trigger',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M12] Alert: Suspected Credential Stuffing Attack — Customer Account Compromised',
    body: `<p>Dear IT Operations,</p>
<p><strong>SECURITY ALERT — IMMEDIATE ACTION REQUIRED</strong></p>
<p>Our threat intelligence platform has detected a credential stuffing attack targeting customer accounts. Mike's account shows signs of compromise — multiple failed login attempts followed by a successful login from an unrecognized IP address.</p>
<p>You are directed to immediately lock the compromised account, investigate the audit trail in Honeycomb, and confirm the incident is contained.</p>
<p>Wizard: <a href="${wizardUrl}">${wizardUrl}</a></p>
<p>Regards,<br>Sarah Chen<br>CISO, ClearBank Philippines</p>`
  }),
  'M12-complete': (baseEmail, wizardUrl) => ({
    id: 'm12-complete',
    missionId: 'M12',
    type: 'completion',
    read: false,
    timestamp: new Date().toISOString(),
    from: 'Sarah Chen <s.chen@clearbank.ph>',
    to: `IT Operations <${deriveAdminEmail(baseEmail)}>`,
    subject: '[M12] Confirmed: Credential Stuffing Incident Resolved — AFASA Article 11 Closed. SecureBank AFASA Compliance Certified.',
    body: `<p>Dear IT Operations,</p>
<p>The credential stuffing incident has been fully resolved:</p>
<ul>
  <li><strong>Mike's account restored:</strong> Lockout cleared, account re-enabled with session revocation confirmed</li>
  <li><strong>Incident logged in Honeycomb:</strong> Full attack timeline documented — failed attempts, lockout event, session revocation all captured in the audit trail</li>
  <li><strong>AFASA Article 11 closed:</strong> Incident response process verified end-to-end</li>
</ul>
<p><strong>Full AFASA Digital Banking Security Framework compliance is now certified.</strong></p>
<p>On behalf of the Board of Directors — thank you for your dedication throughout this training. ClearBank is AFASA Certified.</p>
<p>Regards,<br>Sarah Chen<br>Chief Information Security Officer<br>ClearBank Philippines</p>`
  }),
};

async function seedEmail(emailKey, baseEmail, wizardUrl) {
  const inbox = await readInbox();
  const existing = inbox.find(e => e.id === emailKey.toLowerCase().replace('-', '-'));

  // Derive the id from the template
  const templateFn = EMAIL_TEMPLATES[emailKey];
  if (!templateFn) throw new Error(`Unknown email template: ${emailKey}`);

  const email = templateFn(baseEmail, wizardUrl);

  // Don't duplicate
  if (inbox.find(e => e.id === email.id)) return;

  inbox.push(email);
  await writeInbox(inbox);
}

async function getUnreadCount() {
  const inbox = await readInbox();
  return inbox.filter(e => !e.read).length;
}

async function markRead(id) {
  const inbox = await readInbox();
  const email = inbox.find(e => e.id === id);
  if (email) email.read = true;
  await writeInbox(inbox);
}

async function markAllRead() {
  const inbox = await readInbox();
  for (const e of inbox) e.read = true;
  await writeInbox(inbox);
}

module.exports = {
  readInbox,
  resetInbox,
  seedEmail,
  getUnreadCount,
  markRead,
  markAllRead,
  EMAIL_TEMPLATES,
};
