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

const stageKey = (stage) =>
  ({
    Pinned: 'pinned',
    Applied: 'applied',
    Interviewing: 'interviewing',
    Offers: 'offers',
    'Closed Out': 'info',
  }[stage] || 'info');

function SortableCard({ job, stage, onView, onEdit, onDelete, onMove }) {
  if (!job || !job.id) return null;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
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
        dragListeners={listeners}
        dragAttributes={attributes}
      />
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
  compact = false,
  columns = 5,
  title = 'Job Application Tracker',
  actions = null,
  leftActions = null,
}) {
  const [activeId, setActiveId] = useState(null);
  const [activeSize, setActiveSize] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileStage, setMobileStage] = useState('Pinned');
  const [touchStart, setTouchStart] = useState(null);

  const chipRailRef = useRef(null);
  const chipRefs = useRef({});

  useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth <= 768);
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) return;

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
  }, [mobileStage, isMobile]);

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

        <DragOverlay adjustScale={false}>
          {activeMeta.job ? (
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
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}