// components/applications/ApplicationsBoard.js
import React, { useMemo, useState } from 'react';
import ApplicationCard from './ApplicationCard';
import { colorFor } from '@/components/seeker/dashboard/seekerColors';
import {
  DndContext,
  closestCorners,
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

const STAGES = ['Pinned', 'Applied', 'Interviewing', 'Offers', 'Closed Out'];

const stageKey = (stage) =>
  ({
    Pinned: 'pinned',
    Applied: 'applied',
    Interviewing: 'interviewing',
    Offers: 'offers',
    'Closed Out': 'info',
  }[stage] || 'info');

function SortableCard({ job, stage, onView, onEdit, onDelete }) {
  if (!job || !job.id) return null; // Guard against undefined

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    // With DragOverlay, hide the original while dragging so it doesn't "snap back" visually.
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

  // ✅ NEW: lock overlay width/height to the original card so it doesn’t “jump” away from cursor
  const [activeSize, setActiveSize] = useState(null);

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
  };

  const columnStyle = {
    background: 'white',
    borderRadius: 12,
    padding: compact ? 6 : 8,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    minHeight: '300px',
    position: 'relative',
    height: '100%',
  };

  // ✅ Revert: do NOT force min widths (prevents pushing into right rail)
  const gridTemplateColumns =
    columns === 'auto'
      ? 'repeat(auto-fit, minmax(220px, 1fr))'
      : `repeat(${columns}, minmax(0, 1fr))`;

  const activeMeta = useMemo(() => {
    if (!activeId) return { job: null, stage: null };
    const stage = STAGES.find((s) => stagesData[s]?.some((j) => j?.id === activeId));
    if (!stage) return { job: null, stage: null };
    const job = stagesData[stage].find((j) => j?.id === activeId) || null;
    return { job, stage };
  }, [activeId, stagesData]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    // If dropped outside any droppable, do nothing -> it will return to original spot
    if (!over) return;

    const activeStage = STAGES.find((s) => stagesData[s]?.some((j) => j?.id === active.id));
    if (!activeStage) return;

    // If dropped on a droppable column, over.id will be `${stage}-column`
    let overIdStr = String(over.id);
    let overStage = STAGES.find((s) => overIdStr === `${s}-column`);

    // If dropped on a card, infer stage by card id
    if (!overStage) {
      overStage = STAGES.find((s) => stagesData[s]?.some((j) => j?.id === over.id));
    }

    if (!overStage || activeStage === overStage) return;

    const job = stagesData[activeStage].find((j) => j?.id === active.id);
    if (job && onMove) {
      onMove(job.id, activeStage, overStage, job.pinnedId || null);
    }
  };

  return (
    <section style={wrapStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: compact ? 8 : 12,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flex: '1 1 auto',
            minWidth: 240,
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
          {leftActions}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{actions}</div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }) => {
          setActiveId(active?.id ?? null);

          // ✅ NEW: lock overlay size to the grabbed card’s initial rect
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
          style={{
            display: 'grid',
            gridTemplateColumns,
            gap: compact ? 10 : 8,
            width: '100%',
          }}
        >
          {STAGES.map((stage) => {
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
                    padding: '6px 6px',
                    borderRadius: 999,
                    background: c.bg,
                    color: c.text,
                    border: `1px solid ${c.solid}`,
                    marginBottom: compact ? 6 : 8,
                    fontWeight: 700,
                    width: '100%',
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
                        />
                      ))}
                    </SortableContext>
                  ) : (
                    <div
                      style={{
                        color: '#90A4AE',
                        fontSize: compact ? 12 : 14,
                        textAlign: 'center',
                        padding: '80px 0',
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
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}
