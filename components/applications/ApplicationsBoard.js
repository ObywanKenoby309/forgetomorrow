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
  DragOverlay,
  defaultCoordinates,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 🔸 Use the same stages as the tracker
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
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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
  onAdd,
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
    useSensor(PointerSensor),
    useSensor(TouchSensor),
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
    padding: compact ? 8 : 10,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  };

  const gridTemplateColumns =
    columns === 'auto'
      ? 'repeat(auto-fit, minmax(220px, 1fr))'
      : `repeat(${columns}, minmax(0, 1fr))`;

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeStage = STAGES.find((s) =>
      stagesData[s].some((j) => j.id === active.id)
    );
    const overStage = STAGES.find((s) => over.id.startsWith(`${s}-column`)) || over.id;

    if (activeStage === overStage) {
      // Reorder within same column
      const items = stagesData[activeStage];
      const oldIndex = items.findIndex((j) => j.id === active.id);
      const newIndex = items.findIndex((j) => j.id === over.id);
      if (oldIndex !== newIndex) {
        // No API call needed for reorder — just local
        // But we'll skip for now since order isn't persisted
      }
      return;
    }

    // Move to different column
    const job = stagesData[activeStage].find((j) => j.id === active.id);
    if (job && onMove) {
      onMove(job.id, activeStage, overStage, job.pinnedId);
    }
  };

  return (
    <section style={wrapStyle}>
      {/* Header */}
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

      {/* Board */}
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
                {/* Color-coded header pill with live count */}
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
                  <div style={{ color: '#90A4AE', fontSize: compact ? 12 : 14 }}>
                    No items.
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <DragOverlay />
      </DndContext>
    </section>
  );
}