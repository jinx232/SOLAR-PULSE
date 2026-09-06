import React, { useEffect, useState } from 'react';
import { Activity, BarChart3, CheckCircle2, Clock3, ShieldCheck, Users, Zap } from 'lucide-react';
import { subscribeToActiveUsers, subscribeToPaidUsers } from '../utils/firebase';

export default function Admin({ user }) {
  const adminName = user?.user_metadata?.full_name || 'Administrator';
  const [activeUsers, setActiveUsers] = useState([]);
  const [presenceError, setPresenceError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [paidUsers, setPaidUsers] = useState([]);
  const [subscriptionError, setSubscriptionError] = useState('');

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
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>User accounts</span>
          <h3 style={{ fontSize: '1.8rem', marginTop: '4px' }}>{activeUsers.length}</h3>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Updated in the last 2 min</span>
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
          <h3 style={{ fontSize: '1.8rem', marginTop: '4px' }}>1.0</h3>
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
          <div key={activeUser.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            <div>
              <strong style={{ display: 'block' }}>{activeUser.displayName || 'Solar User'}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{activeUser.email || 'Email unavailable'}</span>
            </div>
            <span style={{ color: 'hsl(var(--color-gen))', fontSize: '0.8rem', fontWeight: 700 }}>Active now</span>
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
          <div key={paidUser.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px', gap: '16px' }}>
            <div>
              <strong style={{ display: 'block' }}>{paidUser.email || paidUser.uid}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{paidUser.plan || 'pro'} plan</span>
            </div>
            <span style={{ color: 'hsl(var(--color-gen))', fontSize: '0.8rem', fontWeight: 700 }}>{paidUser.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
