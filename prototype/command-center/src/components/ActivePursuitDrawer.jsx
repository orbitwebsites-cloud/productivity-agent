export default function ActivePursuitDrawer({
  pursuit,
  isOpen,
  onClose,
  drawerRef,
  onTransitionEnd,
}) {
  return (
    <>
      <div
        className={`motion-backdrop${isOpen ? ' is-visible' : ''}`}
        onClick={onClose}
        inert={!isOpen}
      />
      <aside
        ref={drawerRef}
        className={`motion-drawer${isOpen ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-heading"
        aria-hidden={!isOpen}
        inert={!isOpen}
        onTransitionEnd={onTransitionEnd}
      >
        <div className="drawer-header">
          <h2 id="drawer-heading" data-drawer-heading tabIndex={-1}>
            {pursuit.name}
          </h2>
          <button
            type="button"
            className="drawer-close"
            data-drawer-close
            aria-label="Close drawer"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="drawer-body">
          <p className="drawer-lead">
            Time counts toward <strong>{pursuit.name}</strong> when the app or
            window title matches one of its keywords.
          </p>
          <ul className="keyword-list">
            {pursuit.keywords.map((keyword) => (
              <li key={keyword} className="keyword-chip">
                {keyword}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}
