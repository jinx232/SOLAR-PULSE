import React, { useEffect, useState } from 'react';
import { Activity, BarChart3, CheckCircle2, Clock3, ShieldCheck, Users, Zap } from 'lucide-react';
import { subscribeToActiveUsers, subscribeToPaidUsers, subscribeToSupportTickets, updateTicketStatus, isAdminUser } from '../utils/firebase';

export default function Admin({ user }) {
  const adminName = user?.user_metadata?.full_name || 'Administrator';
  const isAdmin = isAdminUser(user);
  const [activeUsers, setActiveUsers] = useState([]);
  const [presenceError, setPresenceError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [paidUsers, setPaidUsers] = useState([]);
  const [subscriptionError, setSubscriptionError] = useState('');
  const [supportTickets, setSupportTickets] = useState([]);
  const [ticketError, setTicketError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToActiveUsers((users) => {
      setActiveUsers(users.sort((first, second) => second.lastActiveAt - first.lastActiveAt));
      setLastUpdated(new Date());
      setPresenceError('');
    }, () => {
      setPresenceError('Enable Firestore and deploy the included rules to activate live user counts.');
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToPaidUsers((users) => {
      setPaidUsers(users);
      setSubscriptionError('');
    }, () => {
      setSubscriptionError('Paid-user records are unavailable until Firestore is enabled and a payment webhook is connected.');
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToSupportTickets((tickets) => {
      setSupportTickets(tickets.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
      setTicketError('');
    }, () => {
      setTicketError('Support tickets are unavailable until Firestore rules are deployed.');
    });
    return unsubscribe;
  }, []);

  const handleResolveTicket = async (ticketId) => {
    try {
      await updateTicketStatus(ticketId, 'resolved');
    } catch (err) {
      console.error('Error resolving ticket:', err);
    }
  };

  const handleReopenTicket = async (ticketId) => {
    try {
      await updateTicketStatus(ticketId, 'open');
    } catch (err) {
      console.error('Error reopening ticket:', err);
    }
  };

  if (!isAdmin) return null;

  const currentTs = lastUpdated ? lastUpdated.getTime() : 0;

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'hsl(var(--color-solar))', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          <ShieldCheck size={18} /> Admin workspace
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px' }}>Welcome, {adminName}</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Monitor the Solar Pulse platform and review system activity.</p>
      </div>

      <div className="grid-cols-4">
        <div className="premium-card" style={{ borderLeft: '4px solid hsl(var(--color-solar))' }}>
          <Users size={22} style={{ color: 'hsl(var(--color-solar))', marginBottom: '16px' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Active sessions</span>
          <h3 style={{ fontSize: '1.8rem', marginTop: '4px' }}>{activeUsers.length}</h3>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Users active in last 2 min</span>
        </div>
        <div className="premium-card" style={{ borderLeft: '4px solid hsl(var(--color-gen))' }}>
          <Activity size={22} style={{ color: 'hsl(var(--color-gen))', marginBottom: '16px' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Platform status</span>
          <h3 style={{ fontSize: '1.8rem', marginTop: '4px' }}>Online</h3>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{lastUpdated ? `Checked ${lastUpdated.toLocaleTimeString()}` : 'Checking services...'}</span>
        </div>
        <div className="premium-card" style={{ borderLeft: '4px solid hsl(var(--color-bat))' }}>
          <Zap size={22} style={{ color: 'hsl(var(--color-bat))', marginBottom: '16px' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Energy engine</span>
          <h3 style={{ fontSize: '1.8rem', marginTop: '4px' }}>Operational</h3>
        </div>
        <div className="premium-card" style={{ borderLeft: '4px solid hsl(var(--color-con))' }}>
          <BarChart3 size={22} style={{ color: 'hsl(var(--color-con))', marginBottom: '16px' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>App version</span>
          <h3 style={{ fontSize: '1.8rem', marginTop: '4px' }}>2.0.0</h3>
        </div>
        <div className="premium-card" style={{ borderLeft: '4px solid hsl(var(--color-solar))' }}>
          <ShieldCheck size={22} style={{ color: 'hsl(var(--color-solar))', marginBottom: '16px' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Paid subscriptions</span>
          <h3 style={{ fontSize: '1.8rem', marginTop: '4px' }}>{paidUsers.length}</h3>
        </div>
      </div>

      <div className="grid-cols-3">
        <div className="premium-card grid-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>System overview</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Core services connected to this workspace.</p>
          </div>
          {['Firebase Authentication', 'Solar calculation engine', 'AI advisor fallback engine', 'Realtime simulation dashboard'].map((service) => (
            <div key={service} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <span>{service}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--color-gen))', fontSize: '0.8rem', fontWeight: 700 }}>
                <CheckCircle2 size={16} /> Operational
              </span>
            </div>
          ))}
        </div>

        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1.2rem' }}>Admin account</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', wordBreak: 'break-word' }}>{user?.email}</p>
          <div style={{ marginTop: 'auto', padding: '12px', borderRadius: '10px', backgroundColor: 'var(--color-gen-glow)', color: 'hsl(var(--color-gen))', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} /> Verified administrator access
          </div>
        </div>
      </div>

      <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>Live user sessions</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Signed-in users with a recent activity heartbeat.</p>
          </div>
          <Clock3 size={22} style={{ color: 'hsl(var(--color-bat))' }} />
        </div>
        {presenceError && <p style={{ color: '#f59e0b', fontSize: '0.85rem' }}>{presenceError}</p>}
        {!presenceError && activeUsers.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No active sessions detected yet.</p>}
        {activeUsers.map((activeUser) => (
          <div key={activeUser.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <strong style={{ display: 'block', wordBreak: 'break-word' }}>{activeUser.displayName || 'Solar User'}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', wordBreak: 'break-all', display: 'block' }}>{activeUser.email || 'Email unavailable'}</span>
            </div>
            <span style={{ color: 'hsl(var(--color-gen))', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {activeUser.lastActiveAt && currentTs
                ? `Active ${Math.max(1, Math.round((currentTs - activeUser.lastActiveAt) / 1000))}s ago`
                : 'Active recently'}
            </span>
          </div>
        ))}
      </div>

      <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem' }}>Paid accounts</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Subscriptions confirmed by the payment provider.</p>
        </div>
        {subscriptionError && <p style={{ color: '#f59e0b', fontSize: '0.85rem' }}>{subscriptionError}</p>}
        {!subscriptionError && paidUsers.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No paid subscriptions recorded.</p>}
        {paidUsers.map((paidUser) => (
          <div key={paidUser.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px', gap: '12px' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <strong style={{ display: 'block', wordBreak: 'break-all' }}>{paidUser.email || paidUser.uid}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{paidUser.plan || 'pro'} plan</span>
            </div>
            <span style={{ color: 'hsl(var(--color-gen))', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>{paidUser.status}</span>
          </div>
        ))}
      </div>

      {/* Support & Feedback Tickets */}
      <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>Support &amp; Feedback Tickets</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              Submissions received from user complaint modals and the public contact form.
            </p>
          </div>
          <span style={{
            padding: '4px 10px', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 700,
            background: 'rgba(245, 158, 11, 0.15)', color: 'hsl(var(--color-solar))'
          }}>
            {supportTickets.filter(t => t.status !== 'resolved').length} open
          </span>
        </div>

        {ticketError && <p style={{ color: '#f59e0b', fontSize: '0.85rem' }}>{ticketError}</p>}
        {!ticketError && supportTickets.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No support tickets submitted yet.</p>
        )}

        {supportTickets.map((ticket) => (
          <div
            key={ticket.id}
            style={{
              borderTop: '1px solid var(--border-color)',
              paddingTop: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>{ticket.subject || 'No Subject'}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  From: <strong>{ticket.name || 'Anonymous'}</strong> ({ticket.email || 'No email'}) • {ticket.category || 'General'}
                  {ticket.priority && (
                    <span style={{
                      marginLeft: '8px', padding: '1px 6px', borderRadius: '4px', fontSize: '0.72rem',
                      background: ticket.priority === 'high' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
                      color: ticket.priority === 'high' ? '#ef4444' : 'var(--text-secondary)'
                    }}>
                      {ticket.priority} priority
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                  background: ticket.status === 'resolved' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                  color: ticket.status === 'resolved' ? 'hsl(var(--color-gen))' : 'hsl(var(--color-solar))'
                }}>
                  {ticket.status || 'open'}
                </span>
                {ticket.status !== 'resolved' ? (
                  <button
                    onClick={() => handleResolveTicket(ticket.id)}
                    aria-label={`Mark ticket "${ticket.subject || ticket.id}" as resolved`}
                    style={{
                      padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                      background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                      color: 'hsl(var(--color-gen))', cursor: 'pointer'
                    }}
                  >
                    Mark Resolved
                  </button>
                ) : (
                  <button
                    onClick={() => handleReopenTicket(ticket.id)}
                    aria-label={`Reopen ticket "${ticket.subject || ticket.id}"`}
                    style={{
                      padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)',
                      color: 'var(--text-muted)', cursor: 'pointer'
                    }}
                  >
                    Reopen
                  </button>
                )}
              </div>
            </div>
            <p style={{
              fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)',
              padding: '10px 14px', borderRadius: '8px', whiteSpace: 'pre-wrap', lineHeight: '1.5'
            }}>
              {ticket.message || 'No description provided.'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
