import { formatINR } from '../utils/format.js';

export default function StartupCard({ startup, actions, children }) {
  return (
    <article className="startup-card">
      <div className="startup-card-top">
        <span className="industry-pill">{startup.industry}</span>
        <span className="stage-pill">{startup.stage}</span>
      </div>
      <h2>{startup.name}</h2>
      <p className="startup-tagline">{startup.tagline}</p>
      <dl className="startup-facts">
        <div>
          <dt>Funding sought</dt>
          <dd>{formatINR.format(startup.amountSought)}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{startup.location || 'Not specified'}</dd>
        </div>
      </dl>
      {actions && <div className="startup-actions">{actions}</div>}
      {children}
    </article>
  );
}