export default function PursuitRail({ pursuits, selectedId, isDrawerOpen, onSelect }) {
  return (
    <nav className="pursuit-rail" aria-label="Pursuits">
      <h2 className="rail-heading">Pursuits</h2>
      <ul className="pursuit-list">
        {pursuits.map((pursuit) => {
          const isActive = isDrawerOpen && pursuit.id === selectedId;
          return (
            <li key={pursuit.id}>
              <button
                type="button"
                className={`pursuit-item${isActive ? ' active motion-breathe' : ''}`}
                aria-haspopup="dialog"
                aria-expanded={isActive}
                onClick={(event) => onSelect(pursuit.id, event)}
              >
                <span className="pursuit-name">{pursuit.name}</span>
                <span className="pursuit-meta">{pursuit.streak}-day streak</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
