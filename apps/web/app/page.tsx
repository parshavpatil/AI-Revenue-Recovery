'use client';

import { useEffect, useMemo, useState } from 'react';

const API_URL = 'http://localhost:4000/api';
const MERCHANT_ID = 'cmtb9dnlp0000uxwkii2qp7gc';

type VoiceTranscript = {
  id: string;
  sequence: number;
  speaker: string;
  text: string;
  language?: string | null;
  intent?: string | null;
  confidence?: string | null;
};

type VoiceCall = {
  id: string;
  status: string;
  outcome?: string | null;
  durationSeconds?: number | null;
  sentiment?: string | null;
  summary?: string | null;
  confidence?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  transcripts?: VoiceTranscript[];
};

type RecoveryAction = {
  id: string;
  type: string;
  status: string;
  policyDecision?: string | null;
  policyReason?: string | null;
  aiReason?: string | null;
  input?: unknown;
  output?: unknown;
  createdAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
};

type RecoveryCase = {
  id: string;
  merchantId?: string;
  customerId: string;
  paymentId: string;
  status: string;
  priority: string;
  failureCategory: string;
  revenueAtRisk: string;
  recoveryProbability: string;
  expectedRecovery: string;
  attemptCount: number;

  createdAt?: string | null;
  updatedAt?: string | null;

  lastAttemptAt?: string | null;
  nextActionAt?: string | null;
  recoveredAt?: string | null;
  stoppedAt?: string | null;
  stopReason?: string | null;
  aiSummary?: string | null;

  customer?: {
    id?: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    preferredLanguage?: string | null;
    voiceOptIn: boolean;
    smsOptIn: boolean;
    doNotContact?: boolean;
  };

  payment?: {
    id?: string;
    amount: string;
    currency: string;
    status: string;
    method?: string | null;
    failureCategory?: string | null;
    failureReason?: string | null;
  };

  voiceCalls?: VoiceCall[];
  actions?: RecoveryAction[];
};

export default function HomePage() {
  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] =
    useState<RecoveryCase | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadCases = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const response = await fetch(
        `${API_URL}/merchants/${MERCHANT_ID}/recovery-cases`,
        {
          cache: 'no-store',
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || 'Failed to load recovery cases',
        );
      }

      const loadedCases: RecoveryCase[] = Array.isArray(data)
        ? data
        : [];

      setCases(loadedCases);

      setSelectedCase((current) => {
        if (!current) {
          return loadedCases[0] ?? null;
        }

        return (
          loadedCases.find(
            (item) => item.id === current.id,
          ) ?? current
        );
      });
    } catch (error) {
      console.error(error);

      setCases([]);
      setSelectedCase(null);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load recovery cases. Make sure the API is running.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const metrics = useMemo(() => {
    const openCases = cases.filter(
      (item) => item.status === 'OPEN',
    );

    const recoveredCases = cases.filter(
      (item) => item.status === 'RECOVERED',
    );

    const stoppedCases = cases.filter(
      (item) => item.status === 'STOPPED',
    );

    const revenueAtRisk = openCases.reduce(
      (sum, item) =>
        sum + Number(item.revenueAtRisk || 0),
      0,
    );

    const expectedRecovery = openCases.reduce(
      (sum, item) =>
        sum + Number(item.expectedRecovery || 0),
      0,
    );

    const recoveredRevenue = recoveredCases.reduce(
      (sum, item) =>
        sum + Number(item.revenueAtRisk || 0),
      0,
    );

    return {
      total: cases.length,
      open: openCases.length,
      recovered: recoveredCases.length,
      stopped: stoppedCases.length,
      revenueAtRisk,
      expectedRecovery,
      recoveredRevenue,
    };
  }, [cases]);

  const money = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);

  const formatText = (value?: string | null) => {
    if (!value) return 'N/A';

    return value
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const runAIAnalysis = async () => {
    if (!selectedCase) return;

    try {
      setActionLoading(true);
      setActionMessage('');
      setErrorMessage('');

      const response = await fetch(
        `${API_URL}/merchants/${MERCHANT_ID}/ai/recovery-cases/${selectedCase.id}/analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || 'AI analysis failed',
        );
      }

      setActionMessage(
        'AI recovery analysis completed successfully.',
      );

      await loadCases();
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'AI analysis failed.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const executeRecovery = async () => {
    if (!selectedCase) return;

    try {
      setActionLoading(true);
      setActionMessage('');
      setErrorMessage('');

      const response = await fetch(
        `${API_URL}/merchants/${MERCHANT_ID}/recovery-cases/${selectedCase.id}/execute`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || 'Recovery execution failed',
        );
      }

      setActionMessage(
        data?.message ||
          'Recovery action executed successfully.',
      );

      await loadCases();
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Recovery execution failed.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const startVoiceRecovery = async () => {
    if (!selectedCase) return;

    try {
      setActionLoading(true);
      setActionMessage('');
      setErrorMessage('');

      const response = await fetch(
        `${API_URL}/merchants/${MERCHANT_ID}/recovery-cases/${selectedCase.id}/voice`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || 'Voice recovery failed',
        );
      }

      if (data?.duplicate) {
        setActionMessage(
          'An active voice recovery call already exists.',
        );
      } else {
        setActionMessage(
          data?.message ||
            'Voice recovery call started successfully.',
        );
      }

      await loadCases();
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Voice recovery failed.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="dashboard">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">R</div>

          <div>
            <h1>RecoverAI</h1>
            <p>Revenue Recovery Intelligence</p>
          </div>
        </div>

        <div className="merchant">
          <span className="status-dot" />
          <span>Demo Store</span>
        </div>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow">
            AI-POWERED RECOVERY
          </div>

          <h2>
            Recover revenue before
            <br />
            it becomes lost revenue.
          </h2>

          <p>
            Monitor failed payments, understand customer
            intent, and automatically choose the next best
            recovery action.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadCases}
          disabled={loading}
        >
          {loading ? '↻ Loading...' : '↻ Refresh'}
        </button>
      </section>

      {errorMessage && (
        <div
          style={{
            maxWidth: 1380,
            margin: '0 auto 18px',
            padding: '0 42px',
          }}
        >
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '12px 15px',
              borderRadius: 10,
              fontSize: 12,
            }}
          >
            {errorMessage}
          </div>
        </div>
      )}

      {actionMessage && (
        <div
          style={{
            maxWidth: 1380,
            margin: '0 auto 18px',
            padding: '0 42px',
          }}
        >
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#047857',
              padding: '12px 15px',
              borderRadius: 10,
              fontSize: 12,
            }}
          >
            {actionMessage}
          </div>
        </div>
      )}

      <section className="metrics">
        <MetricCard
          label="Revenue at Risk"
          value={money(metrics.revenueAtRisk)}
          description="Currently open cases"
          accent="danger"
        />

        <MetricCard
          label="Expected Recovery"
          value={money(metrics.expectedRecovery)}
          description="AI-estimated recoverable revenue"
          accent="purple"
        />

        <MetricCard
          label="Recovered Revenue"
          value={money(metrics.recoveredRevenue)}
          description={`${metrics.recovered} recovered cases`}
          accent="success"
        />

        <MetricCard
          label="Open Cases"
          value={String(metrics.open)}
          description={`${metrics.total} total recovery cases`}
          accent="blue"
        />
      </section>

      <section className="content-grid">
        <div className="cases-panel">
          <div className="panel-header">
            <div>
              <h3>Recovery Cases</h3>

              <p>
                Failed payments requiring recovery action
              </p>
            </div>

            <span className="case-count">
              {cases.length} cases
            </span>
          </div>

          {loading ? (
            <div className="empty-state">
              Loading recovery cases...
            </div>
          ) : cases.length === 0 ? (
            <div className="empty-state">
              No recovery cases found.
            </div>
          ) : (
            <div className="case-list">
              {cases.map((item) => (
                <button
                  key={item.id}
                  className={`case-row ${
                    selectedCase?.id === item.id
                      ? 'selected'
                      : ''
                  }`}
                  onClick={() => {
                    setSelectedCase(item);
                    setActionMessage('');
                    setErrorMessage('');
                  }}
                >
                  <div className="customer-avatar">
                    {item.customer?.name
                      ?.charAt(0)
                      .toUpperCase() || '?'}
                  </div>

                  <div className="case-main">
                    <strong>
                      {item.customer?.name ||
                        'Unknown customer'}
                    </strong>

                    <span>
                      {formatText(
                        item.failureCategory,
                      )}
                    </span>
                  </div>

                  <div className="case-amount">
                    <strong>
                      {money(
                        Number(item.revenueAtRisk),
                      )}
                    </strong>

                    <span>at risk</span>
                  </div>

                  <StatusBadge status={item.status} />

                  <span className="arrow">›</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="details-panel">
          {selectedCase ? (
            <CaseDetails
              recoveryCase={selectedCase}
              money={money}
              formatText={formatText}
              actionLoading={actionLoading}
              onAnalyze={runAIAnalysis}
              onExecute={executeRecovery}
              onVoice={startVoiceRecovery}
            />
          ) : (
            <div className="details-empty">
              <div className="details-icon">↗</div>

              <h3>Select a recovery case</h3>

              <p>
                Choose a case to inspect payment details,
                AI recovery decisions, and voice activity.
              </p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  description,
  accent,
}: {
  label: string;
  value: string;
  description: string;
  accent: string;
}) {
  return (
    <article className={`metric-card ${accent}`}>
      <div className="metric-top">
        <span>{label}</span>

        <div className="metric-icon">
          {accent === 'danger'
            ? '₹'
            : accent === 'purple'
              ? '✦'
              : accent === 'success'
                ? '✓'
                : '○'}
        </div>
      </div>

      <strong>{value}</strong>

      <p>{description}</p>
    </article>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className={`status-badge ${status.toLowerCase()}`}
    >
      <span />
      {formatStatus(status)}
    </span>
  );
}

function formatStatus(status: string) {
  return status
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function CaseDetails({
  recoveryCase,
  money,
  formatText,
  actionLoading,
  onAnalyze,
  onExecute,
  onVoice,
}: {
  recoveryCase: RecoveryCase;
  money: (value: number) => string;
  formatText: (value?: string | null) => string;
  actionLoading: boolean;
  onAnalyze: () => void;
  onExecute: () => void;
  onVoice: () => void;
}) {
  const voiceCall =
    recoveryCase.voiceCalls &&
    recoveryCase.voiceCalls.length > 0
      ? recoveryCase.voiceCalls[
          recoveryCase.voiceCalls.length - 1
        ]
      : null;

  const latestAction =
    recoveryCase.actions &&
    recoveryCase.actions.length > 0
      ? recoveryCase.actions[
          recoveryCase.actions.length - 1
        ]
      : null;

  const probability =
    Number(recoveryCase.recoveryProbability || 0) * 100;

  const isOpen = recoveryCase.status === 'OPEN';

  const hasVoice =
    recoveryCase.customer?.voiceOptIn === true;

  const hasSms =
    recoveryCase.customer?.smsOptIn === true;

  const doNotContact =
    recoveryCase.customer?.doNotContact === true;

  return (
    <div>
      <div className="details-header">
        <div>
          <div className="eyebrow">
            RECOVERY CASE
          </div>

          <h3>
            {recoveryCase.customer?.name ||
              'Unknown customer'}
          </h3>
        </div>

        <StatusBadge status={recoveryCase.status} />
      </div>

      {isOpen && !doNotContact && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 22,
          }}
        >
          <button
            className="refresh-button"
            onClick={onAnalyze}
            disabled={actionLoading}
          >
            {actionLoading
              ? 'Working...'
              : '✦ Analyze with AI'}
          </button>

          <button
            className="refresh-button"
            onClick={onExecute}
            disabled={actionLoading}
          >
            {actionLoading
              ? 'Working...'
              : '⚡ Execute Recovery'}
          </button>

          {hasVoice && (
            <button
              className="refresh-button"
              onClick={onVoice}
              disabled={actionLoading}
            >
              {actionLoading
                ? 'Calling...'
                : '☎ Start Voice Recovery'}
            </button>
          )}
        </div>
      )}

      {doNotContact && (
        <div
          style={{
            marginBottom: 22,
            padding: 12,
            borderRadius: 10,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: 11,
          }}
        >
          Customer has opted out of contact.
          Recovery communication is disabled.
        </div>
      )}

      <div className="detail-section">
        <h4>Payment</h4>

        <div className="detail-grid">
          <Detail
            label="Amount"
            value={money(
              Number(recoveryCase.revenueAtRisk),
            )}
          />

          <Detail
            label="Failure"
            value={formatText(
              recoveryCase.failureCategory,
            )}
          />

          <Detail
            label="Payment status"
            value={
              recoveryCase.payment?.status ||
              'UNKNOWN'
            }
          />

          <Detail
            label="Payment method"
            value={formatText(
              recoveryCase.payment?.method,
            )}
          />

          <Detail
            label="Attempts"
            value={String(
              recoveryCase.attemptCount,
            )}
          />

          <Detail
            label="Priority"
            value={formatText(
              recoveryCase.priority,
            )}
          />
        </div>

        {recoveryCase.payment?.failureReason && (
          <div className="reason-box">
            <span>Failure reason</span>

            <p>
              {recoveryCase.payment.failureReason}
            </p>
          </div>
        )}
      </div>

      <div className="detail-section">
        <h4>AI Recovery Intelligence</h4>

        <div className="ai-card">
          <div className="ai-icon">✦</div>

          <div>
            <strong>
              {probability.toFixed(0)}% recovery probability
            </strong>

            <p>
              Expected recovery:{' '}
              {money(
                Number(
                  recoveryCase.expectedRecovery,
                ),
              )}
            </p>

            {recoveryCase.aiSummary && (
              <p style={{ marginTop: 8 }}>
                {recoveryCase.aiSummary}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h4>Customer</h4>

        <div className="detail-grid">
          <Detail
            label="Name"
            value={
              recoveryCase.customer?.name ||
              'Unknown'
            }
          />

          <Detail
            label="Phone"
            value={
              recoveryCase.customer?.phone ||
              'N/A'
            }
          />

          <Detail
            label="Email"
            value={
              recoveryCase.customer?.email ||
              'N/A'
            }
          />

          <Detail
            label="Language"
            value={
              recoveryCase.customer
                ?.preferredLanguage
                ? formatText(
                    recoveryCase.customer
                      .preferredLanguage,
                  )
                : 'N/A'
            }
          />
        </div>
      </div>

      <div className="detail-section">
        <h4>Customer Preferences</h4>

        <div className="preferences">
          <Preference
            label="SMS"
            enabled={hasSms}
          />

          <Preference
            label="Voice"
            enabled={hasVoice}
          />
        </div>
      </div>

      <div className="detail-section">
        <h4>Voice Recovery</h4>

        {voiceCall ? (
          <VoiceCallDetails
            voiceCall={voiceCall}
            formatText={formatText}
          />
        ) : (
          <div className="no-voice">
            No voice recovery attempt yet.
          </div>
        )}
      </div>

      {latestAction && (
        <div className="detail-section">
          <h4>Latest Recovery Action</h4>

          <div className="voice-card">
            <div className="detail-grid">
              <Detail
                label="Type"
                value={formatText(
                  latestAction.type,
                )}
              />

              <Detail
                label="Status"
                value={formatText(
                  latestAction.status,
                )}
              />

              <Detail
                label="Policy"
                value={formatText(
                  latestAction.policyDecision,
                )}
              />
            </div>

            {latestAction.aiReason && (
              <div className="reason-box">
                <span>AI reason</span>

                <p>
                  {latestAction.aiReason}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="detail-section">
        <h4>Recovery Status</h4>

        <div className="detail-grid">
          <Detail
            label="Created"
            value={formatDate(
              recoveryCase.createdAt,
            )}
          />

          <Detail
            label="Last attempt"
            value={formatDate(
              recoveryCase.lastAttemptAt,
            )}
          />

          <Detail
            label="Next action"
            value={formatDate(
              recoveryCase.nextActionAt,
            )}
          />

          <Detail
            label="Recovered"
            value={formatDate(
              recoveryCase.recoveredAt,
            )}
          />
        </div>

        {recoveryCase.stopReason && (
          <div className="reason-box">
            <span>Stop reason</span>

            <p>
              {recoveryCase.stopReason}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function VoiceCallDetails({
  voiceCall,
  formatText,
}: {
  voiceCall: VoiceCall;
  formatText: (value?: string | null) => string;
}) {
  return (
    <div className="voice-card">
      <div className="voice-header">
        <div className="voice-icon">☎</div>

        <div>
          <strong>
            {formatText(voiceCall.status)}
          </strong>

          <span>
            {voiceCall.durationSeconds != null
              ? `${voiceCall.durationSeconds}s`
              : 'No duration'}
          </span>
        </div>
      </div>

      {voiceCall.outcome && (
        <div className="voice-outcome">
          <span>Outcome</span>

          <strong>
            {formatText(voiceCall.outcome)}
          </strong>
        </div>
      )}

      {voiceCall.sentiment && (
        <div className="voice-outcome">
          <span>Sentiment</span>

          <strong>
            {formatText(voiceCall.sentiment)}
          </strong>
        </div>
      )}

      {voiceCall.confidence && (
        <div className="voice-outcome">
          <span>Confidence</span>

          <strong>
            {Math.round(
              Number(voiceCall.confidence) * 100,
            )}
            %
          </strong>
        </div>
      )}

      {voiceCall.summary && (
        <p className="voice-summary">
          {voiceCall.summary}
        </p>
      )}

      {voiceCall.transcripts &&
        voiceCall.transcripts.length > 0 && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid #e4e8ed',
            }}
          >
            <strong
              style={{
                fontSize: 10,
              }}
            >
              Call Transcript
            </strong>

            <div
              style={{
                marginTop: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {voiceCall.transcripts.map(
                (turn) => (
                  <div
                    key={turn.id}
                    style={{
                      padding: 9,
                      borderRadius: 8,
                      background:
                        turn.speaker ===
                        'CUSTOMER'
                          ? '#f8fafc'
                          : '#f7f5ff',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 8,
                        fontWeight: 800,
                        color:
                          turn.speaker ===
                          'CUSTOMER'
                            ? '#64748b'
                            : '#6d28d9',
                        marginBottom: 4,
                      }}
                    >
                      {turn.speaker}
                    </div>

                    <div
                      style={{
                        fontSize: 10,
                        lineHeight: 1.5,
                        color: '#4b5563',
                      }}
                    >
                      {turn.text}
                    </div>

                    {turn.intent && (
                      <div
                        style={{
                          marginTop: 5,
                          fontSize: 8,
                          color: '#9aa1af',
                        }}
                      >
                        Intent:{' '}
                        {formatText(
                          turn.intent,
                        )}
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>
          </div>
        )}
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="detail">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

function Preference({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <div className="preference">
      <span>{label}</span>

      <span
        className={
          enabled
            ? 'preference-on'
            : 'preference-off'
        }
      >
        {enabled ? 'OPTED IN' : 'OFF'}
      </span>
    </div>
  );
}

function formatDate(
  value?: string | null,
) {
  if (!value) return 'N/A';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}