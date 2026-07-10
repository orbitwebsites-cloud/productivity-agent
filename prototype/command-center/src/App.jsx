import { useEffect, useRef, useState } from 'react';
import { PURSUITS, SIGNALS } from './data/pursuits';
import { usePersistentState } from './hooks/usePersistentState';
import BackgroundCanvas from './components/BackgroundCanvas';
import PursuitRail from './components/PursuitRail';
import ActivePursuitDrawer from './components/ActivePursuitDrawer';
import SignalRail from './components/SignalRail';
import './elegance.css';
import './App.css';

export default function App() {
  const [selectedId, setSelectedId] = usePersistentState(
    'command-center:selectedId',
    PURSUITS[0].id,
  );
  const [signalsExpanded, setSignalsExpanded] = usePersistentState(
    'command-center:signalsExpanded',
    true,
  );
  // Ephemeral UI state: always closed on load for a clean daily start.
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const triggerRef = useRef(null);
  const drawerRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  function openPursuit(id, event) {
    triggerRef.current = event.currentTarget;
    setSelectedId(id);
    setIsDrawerOpen(true);
  }

  function closeDrawer() {
    setIsDrawerOpen(false);
  }

  // Focus is moved in lockstep with the actual CSS transition (rather than a
  // hard-coded timeout) so it stays correct if the duration changes or
  // reduced-motion shortens it to ~0.
  function handleDrawerTransitionEnd(event) {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform') {
      return;
    }
    if (isDrawerOpen) {
      const heading = drawerRef.current?.querySelector('[data-drawer-heading]');
      const closeButton = drawerRef.current?.querySelector('[data-drawer-close]');
      (heading ?? closeButton)?.focus();
    } else {
      triggerRef.current?.focus();
    }
  }

  const selectedPursuit = PURSUITS.find((pursuit) => pursuit.id === selectedId) ?? PURSUITS[0];

  return (
    <div className="command-center">
      <BackgroundCanvas />
      <PursuitRail
        pursuits={PURSUITS}
        selectedId={selectedId}
        isDrawerOpen={isDrawerOpen}
        onSelect={openPursuit}
      />

      <main className="command-center-stage">
        <h1>CommandCenter</h1>
        <p className="stage-hint">Select a pursuit to open its workspace.</p>
      </main>

      <SignalRail
        signals={SIGNALS}
        expanded={signalsExpanded}
        onToggle={() => setSignalsExpanded((value) => !value)}
      />

      <ActivePursuitDrawer
        pursuit={selectedPursuit}
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        drawerRef={drawerRef}
        onTransitionEnd={handleDrawerTransitionEnd}
      />
    </div>
  );
}
