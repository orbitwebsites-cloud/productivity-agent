export default function SignalRail({ signals, expanded, onToggle }) {
  return (
    <aside className="signal-rail" aria-label="Signals">
      <button
        type="button"
        className="signal-rail-toggle"
        aria-expanded={expanded}
        aria-controls="signal-rail-content"
        onClick={onToggle}
      >
        <span>Signals</span>
        <span className={`chevron${expanded ? ' is-expanded' : ''}`} aria-hidden="true">
          ⌄
        </span>
      </button>
      <div className={`motion-collapse${expanded ? ' is-expanded' : ''}`}>
        <div className="motion-collapse-inner" id="signal-rail-content">
          <ul className="signal-list">
            {signals.map((signal) => (
              <li key={signal.id} className="signal-chip">
                <span className="signal-label">{signal.label}</span>
                <span className="signal-minutes">{signal.minutes}m</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
