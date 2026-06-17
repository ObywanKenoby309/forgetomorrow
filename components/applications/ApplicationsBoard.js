// components/applications/ApplicationsBoard.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ApplicationCard from './ApplicationCard';
import { colorFor } from '@/components/seeker/dashboard/seekerColors';
import {
  DndContext,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { snapCenterToCursor } from '@dnd-kit/modifiers';

const STAGES = ['Pinned', 'Applied', 'Interviewing', 'Offers', 'Closed Out'];

const STAGE_ABBR = {
  Pinned: 'PIN',
  Applied: 'APP',
  Interviewing: 'INT',
  Offers: 'OFR',
  'Closed Out': 'CLO',
};

const stageKey = (stage) =>
  ({
    Pinned: 'pinned',
    Applied: 'applied',
    Interviewing: 'interviewing',
    Offers: 'offers',
    'Closed Out': 'info',
  }[stage] || 'info');

// Mirrors the lock rule already enforced in ApplicationForm.js: any
// application tied to a real job posting (jobId), once past Pinned, is
// recruiter-controlled — the backend rejects manual status changes on it.
function isApplicationLocked(job, stage) {
  if (!job) return false;
  if (job.locked === true || job.isRecruiterControlled === true) return true;
  return Boolean(job.jobId) && stage !== 'Pinned';
}

function SortableCard({ job, stage, onView, onEdit, onDelete, onMove, onOpenPrep }) {
  if (!job || !job.id) return null;

  const locked = isApplicationLocked(job, stage);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
    disabled: locked,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 1 : 1,
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} key={job.id}>
      <ApplicationCard
        job={job}
        stage={stage}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onMove={onMove}
        onOpenPrep={onOpenPrep}
        dragListeners={listeners}
        dragAttributes={attributes}
        locked={locked}
      />
    </div>
  );
}

// Whole-chip drag target for the mobile mini-lane board. Unlike the desktop
// SortableCard (which only exposes a small drag handle via ApplicationCard),
// these chips are too small for a separate handle, so the whole chip is the
// drag surface. dnd-kit's TouchSensor delay already disambiguates a quick
// tap (fires onClick normally) from a held drag (suppresses the click).
function MiniSortableCard({ job, stage, accent, onView }) {
  if (!job || !job.id) return null;

  const locked = isApplicationLocked(job, stage);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
    disabled: locked,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0 : 1,
    // ✅ Without this, Android's native touch-scroll grabs the gesture
    // before TouchSensor's hold-to-drag delay ever gets a chance to fire —
    // the card never even starts dragging, regardless of lock state.
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(locked ? {} : { ...attributes, ...listeners })}
      onClick={() => onView && onView(job, stage)}
    >
      <div
        style={{
          borderRadius: 8,
          overflow: 'hidden',
          background: '#ffffff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          cursor: locked ? 'default' : 'pointer',
          opacity: locked ? 0.72 : 1,
          position: 'relative',
        }}
      >
        {locked && (
          <span
            title="Managed by the recruiter — moves automatically with the job pipeline"
            style={{ position: 'absolute', top: 2, right: 2, fontSize: 8, lineHeight: 1 }}
          >
            🔒
          </span>
        )}
        <div style={{ height: 3, background: accent }} />
        <div style={{ minHeight: 35, display: 'flex', alignItems: 'center', padding: '4px 5px' }}>
          <span
            style={{
              width: '100%',
              fontSize: 9.5,
              fontWeight: 700,
              color: '#112033',
              lineHeight: 1.22,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {job.title}
          </span>
        </div>
      </div>
    </div>
  );
}

function DroppableColumn({ id, children }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} style={{ height: '100%' }}>
      {children}
    </div>
  );
}

// Flat, grouped list — no drag. Used by the mobile "List" view.
function MobileListView({ stagesData, onView }) {
  const isEmpty = STAGES.every((s) => !((stagesData[s] || []).filter(Boolean).length));

  if (isEmpty) {
    return (
      <div style={{ textAlign: 'center', color: '#90A4AE', fontSize: 13, padding: '60px 0' }}>
        No applications yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 4 }}>
      {STAGES.map((stage) => {
        const items = (stagesData[stage] || []).filter(Boolean);
        if (!items.length) return null;
        const c = colorFor(stageKey(stage));

        return (
          <div key={stage} style={{ marginBottom: 4 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: c.text,
                padding: '8px 4px 6px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.solid, flexShrink: 0 }} />
              {stage} <span style={{ opacity: 0.55, fontWeight: 700 }}>{items.length}</span>
            </div>

            {items.map((job) => (
              <div
                key={job.id}
                onClick={() => onView && onView(job, stage)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#fff',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 12,
                  padding: '10px 12px',
                  marginBottom: 6,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: c.solid, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: '#112033',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {job.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: '#607D8B',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {job.company}
                    {job.location ? ` · ${job.location}` : ''}
                  </div>
                </div>
                <div style={{ fontSize: 10.5, color: '#90A4AE', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {job.dateAdded}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default function ApplicationsBoard({
  stagesData = {
    Pinned: [],
    Applied: [],
    Interviewing: [],
    Offers: [],
    'Closed Out': [],
  },
  onMove,
  onEdit,
  onDelete,
  onView,
  onOpenPrep,
  compact = false,
  columns = 5,
  title = 'Job Application Tracker',
  actions = null,
  leftActions = null,
}) {
  const [activeId, setActiveId] = useState(null);
  const [activeSize, setActiveSize] = useState(null);

  // ✅ Mobile breakpoint matches the platform-wide convention (SeekerLayout, etc).
  // Synchronous initializer avoids a desktop-first paint flash on first mobile frame.
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );
  const [mobileStage, setMobileStage] = useState('Pinned');
  // 'board' = mini multi-lane glance, 'focus' = single-stage full cards, 'list' = flat grouped list
  const [mobileView, setMobileView] = useState('board');
  const [touchStart, setTouchStart] = useState(null);

  const chipRailRef = useRef(null);
  const chipRefs = useRef({});

  useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  useEffect(() => {
    if (!isMobile || mobileView !== 'focus') return;

    const rail = chipRailRef.current;
    const chip = chipRefs.current[mobileStage];
    if (!rail || !chip) return;

    const railRect = rail.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();

    const chipCenter = chip.offsetLeft + chipRect.width / 2;
    const targetScrollLeft = chipCenter - railRect.width / 2;

    rail.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: 'smooth',
    });
  }, [mobileStage, isMobile, mobileView]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const wrapStyle = {
    background: 'white',
    border: '1px solid #eee',
    borderRadius: 12,
    padding: compact ? 10 : 8,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    width: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
  };

  const columnStyle = {
    background: 'white',
    borderRadius: 12,
    padding: compact ? 6 : 8,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    minHeight: isMobile ? '220px' : '300px',
    position: 'relative',
    height: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  };

  const gridTemplateColumns = isMobile
    ? '1fr'
    : columns === 'auto'
      ? 'repeat(auto-fit, minmax(220px, 1fr))'
      : `repeat(${columns}, minmax(0, 1fr))`;

  const visibleStages = isMobile ? [mobileStage] : STAGES;

  const activeMeta = useMemo(() => {
    if (!activeId) return { job: null, stage: null };
    const stage = STAGES.find((s) => stagesData[s]?.some((j) => j?.id === activeId));
    if (!stage) return { job: null, stage: null };
    const job = stagesData[stage].find((j) => j?.id === activeId) || null;
    return { job, stage };
  }, [activeId, stagesData]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeStage = STAGES.find((s) => stagesData[s]?.some((j) => j?.id === active.id));
    if (!activeStage) return;

    let overIdStr = String(over.id);
    let overStage = STAGES.find((s) => overIdStr === `${s}-column`);

    if (!overStage) {
      overStage = STAGES.find((s) => stagesData[s]?.some((j) => j?.id === over.id));
    }

    if (!overStage || activeStage === overStage) return;

    const job = stagesData[activeStage].find((j) => j?.id === active.id);
    if (job && onMove) {
      onMove(job.id, activeStage, overStage, job.pinnedId || null);
    }
  };

  const handleMobileSwipeStart = (e) => {
    if (!isMobile) return;
    const touch = e.touches?.[0];
    if (!touch) return;
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleMobileSwipeEnd = (e) => {
    if (!isMobile || !touchStart) return;

    const touch = e.changedTouches?.[0];
    if (!touch) {
      setTouchStart(null);
      return;
    }

    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;

    setTouchStart(null);

    if (Math.abs(dx) < 50) return;
    if (Math.abs(dx) <= Math.abs(dy)) return;

    const currentIndex = STAGES.indexOf(mobileStage);
    if (currentIndex === -1) return;

    if (dx < 0 && currentIndex < STAGES.length - 1) {
      setMobileStage(STAGES[currentIndex + 1]);
    } else if (dx > 0 && currentIndex > 0) {
      setMobileStage(STAGES[currentIndex - 1]);
    }
  };

  return (
    <section style={wrapStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: isMobile ? 10 : 12,
          marginBottom: compact ? 8 : 12,
          flexWrap: 'wrap',
          flexDirection: isMobile ? 'column' : 'row',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: isMobile ? 10 : 12,
            flex: '1 1 auto',
            minWidth: isMobile ? 0 : 240,
            flexDirection: isMobile ? 'column' : 'row',
          }}
        >
          <h2
            style={{
              color: '#FF7043',
              margin: 0,
              fontSize: compact ? '1.05rem' : '1.25rem',
            }}
          >
            {title}
          </h2>

          <div
            style={{
              display: 'flex',
              width: isMobile ? '100%' : 'auto',
              maxWidth: '100%',
              minWidth: 0,
            }}
          >
            {leftActions}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: isMobile ? '100%' : 'auto',
            maxWidth: '100%',
            minWidth: 0,
          }}
        >
          {actions}
        </div>
      </div>

      {isMobile && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: compact ? 8 : 10,
            background: 'rgba(0,0,0,0.045)',
            borderRadius: 10,
            padding: 3,
            boxSizing: 'border-box',
          }}
        >
          {[
            { key: 'board', label: 'Board' },
            { key: 'focus', label: 'Focus' },
            { key: 'list', label: 'List' },
          ].map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setMobileView(v.key)}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: 8,
                padding: '8px 0',
                fontWeight: 800,
                fontSize: 12.5,
                cursor: 'pointer',
                background: mobileView === v.key ? '#FF7043' : 'transparent',
                color: mobileView === v.key ? '#fff' : '#607D8B',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      {isMobile && mobileView === 'focus' && (
        <div
          ref={chipRailRef}
          onTouchStart={handleMobileSwipeStart}
          onTouchEnd={handleMobileSwipeEnd}
          style={{
            width: '100%',
            maxWidth: '100%',
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 6,
            marginBottom: compact ? 8 : 10,
            boxSizing: 'border-box',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollSnapType: 'x proximity',
            touchAction: 'pan-x',
          }}
        >
          <div
            style={{
              display: 'inline-grid',
              gridAutoFlow: 'column',
              gridAutoColumns: 'max-content',
              gap: 8,
              width: 'max-content',
              minWidth: '100%',
              boxSizing: 'border-box',
              paddingRight: 8,
            }}
          >
            {STAGES.map((stage) => {
              const c = colorFor(stageKey(stage));
              const isActive = mobileStage === stage;
              const count = (stagesData[stage] || []).filter(Boolean).length;

              return (
                <button
                  key={stage}
                  ref={(el) => {
                    chipRefs.current[stage] = el;
                  }}
                  type="button"
                  onClick={() => setMobileStage(stage)}
                  style={{
                    borderRadius: 999,
                    border: `1px solid ${c.solid}`,
                    background: isActive ? c.bg : '#fff',
                    color: c.text,
                    padding: '10px 16px',
                    fontWeight: 800,
                    fontSize: 14,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    scrollSnapAlign: 'start',
                  }}
                >
                  {stage} {count}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isMobile && mobileView === 'list' && (
        <MobileListView stagesData={stagesData} onView={onView} />
      )}

      {(!isMobile || mobileView !== 'list') && (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          modifiers={[snapCenterToCursor]}
          onDragStart={({ active }) => {
            setActiveId(active?.id ?? null);

            const r = active?.rect?.current?.initial;
            if (r?.width && r?.height) setActiveSize({ width: r.width, height: r.height });
            else setActiveSize(null);
          }}
          onDragCancel={() => {
            setActiveId(null);
            setActiveSize(null);
          }}
          onDragEnd={(event) => {
            handleDragEnd(event);
            setActiveId(null);
            setActiveSize(null);
          }}
        >
          {(!isMobile || mobileView === 'focus') && (
            <div
              onTouchStart={handleMobileSwipeStart}
              onTouchEnd={handleMobileSwipeEnd}
              style={{
                display: 'grid',
                gridTemplateColumns,
                gap: compact ? 10 : 8,
                width: '100%',
                touchAction: isMobile ? 'pan-y' : 'auto',
              }}
            >
              {visibleStages.map((stage) => {
                const c = colorFor(stageKey(stage));
                const items = (stagesData[stage] || []).filter(Boolean);
                const columnId = `${stage}-column`;

                return (
                  <div key={stage} style={columnStyle}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: isMobile ? '8px 10px' : '6px 6px',
                        borderRadius: 999,
                        background: c.bg,
                        color: c.text,
                        border: `1px solid ${c.solid}`,
                        marginBottom: compact ? 6 : 8,
                        fontWeight: 700,
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      <span style={{ whiteSpace: 'nowrap' }}>{stage}</span>
                      <span style={{ fontWeight: 900, whiteSpace: 'nowrap' }}>{items.length}</span>
                    </div>

                    <DroppableColumn id={columnId}>
                      {items.length > 0 ? (
                        <SortableContext
                          items={items.map((j) => j.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {items.map((job) => (
                            <SortableCard
                              key={job.id}
                              job={job}
                              stage={stage}
                              onView={onView}
                              onEdit={onEdit}
                              onDelete={onDelete}
                              onMove={onMove}
                              onOpenPrep={onOpenPrep}
                            />
                          ))}
                        </SortableContext>
                      ) : (
                        <div
                          style={{
                            color: '#90A4AE',
                            fontSize: compact ? 12 : 14,
                            textAlign: 'center',
                            padding: isMobile ? '56px 0' : '80px 0',
                          }}
                        >
                          No items. Drop here.
                        </div>
                      )}
                    </DroppableColumn>
                  </div>
                );
              })}
            </div>
          )}

          {isMobile && mobileView === 'board' && (
            <div style={{ display: 'flex', gap: 4, width: '100%' }}>
              {STAGES.map((stage) => {
                const c = colorFor(stageKey(stage));
                const items = (stagesData[stage] || []).filter(Boolean);
                const columnId = `${stage}-column`;

                return (
                  <div key={stage} style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <div
                      style={{
                        textAlign: 'center',
                        fontSize: 9,
                        fontWeight: 800,
                        color: c.text,
                        background: c.bg,
                        border: `1px solid ${c.solid}`,
                        borderRadius: 8,
                        padding: '4px 2px',
                        marginBottom: 5,
                        boxSizing: 'border-box',
                      }}
                    >
                      {STAGE_ABBR[stage] || stage.slice(0, 3).toUpperCase()}{' '}
                      <span style={{ opacity: 0.65 }}>{items.length}</span>
                    </div>

                    <DroppableColumn id={columnId}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minHeight: 50, touchAction: 'pan-y' }}>
                        {items.length > 0 ? (
                          <SortableContext items={items.map((j) => j.id)} strategy={verticalListSortingStrategy}>
                            {items.map((job) => (
                              <MiniSortableCard
                                key={job.id}
                                job={job}
                                stage={stage}
                                accent={c.solid}
                                onView={onView}
                              />
                            ))}
                          </SortableContext>
                        ) : (
                          <div style={{ height: 36, border: '1.5px dashed rgba(0,0,0,0.14)', borderRadius: 8 }} />
                        )}
                      </div>
                    </DroppableColumn>
                  </div>
                );
              })}
            </div>
          )}

          <DragOverlay adjustScale={false}>
            {activeMeta.job ? (
              isMobile && mobileView === 'board' ? (
                <div style={{ width: activeSize?.width || 64, pointerEvents: 'none' }}>
                  <div style={{ borderRadius: 8, overflow: 'hidden', boxShadow: '0 14px 24px rgba(0,0,0,0.3)', background: '#fff' }}>
                    <div style={{ height: 3, background: colorFor(stageKey(activeMeta.stage)).solid }} />
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: '#112033', padding: '5px 4px', lineHeight: 1.22 }}>
                      {activeMeta.job.title}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    pointerEvents: 'none',
                    width: activeSize?.width || 'auto',
                    height: activeSize?.height || 'auto',
                  }}
                >
                  <ApplicationCard
                    job={activeMeta.job}
                    stage={activeMeta.stage}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onMove={onMove}
                    onOpenPrep={onOpenPrep}
                  />
                </div>
              )
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </section>
  );
}