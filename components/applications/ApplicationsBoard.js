import React from 'react';
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
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
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
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Allow grab with small movement
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const wrapStyle = {
    background: 'white',
    border: '1px solid #eee',
    borderRadius: 12,
    padding: compact ? 12 : 16,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    width: '100%',
    boxSizing: 'border-box',
  };

  const columnStyle = {
    background: 'white',
    borderRadius: 12,
    padding: compact ? 8 : 16, // Increased padding for better drop target
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    minHeight: '200px', // Ensure empty columns have height
    position: 'relative',
  };

  const gridTemplateColumns =
    columns === 'auto'
      ? 'repeat(auto-fit, minmax(220px, 1fr))'
      : `repeat(${columns}, minmax(0, 1fr))`;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeStage = STAGES.find((s) => stagesData[s]?.some((j) => j.id === active.id));
    if (!activeStage) return;

    let overIdStr = String(over.id);
    let overStage = STAGES.find((s) => overIdStr.startsWith(`${s}-column`));

    if (!overStage) {
      overStage = STAGES.find((s) => stagesData[s]?.some((j) => j.id === over.id));
    }

    if (!overStage || activeStage === overStage) return;

    const job = stagesData[activeStage].find((j) => j.id === active.id);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {actions}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns,
            gap: compact ? 12 : 20,
            width: '100%',
          }}
        >
          {STAGES.map((stage) => {
            const c = colorFor(stageKey(stage));
            const items = stagesData[stage] || [];
            const columnId = `${stage}-column`;

            return (
              <div key={stage} style={columnStyle} id={columnId}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '6px 10px',
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
                  <span style={{ fontWeight: 900 }}>{items.length}</span>
                </div>

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
                      padding: '40px 0',
                    }}
                  >
                    No items.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DndContext>
    </section>
  );
}