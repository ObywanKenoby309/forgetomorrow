// components/coaching/ClientTargetStrategy.js

import CommandBrief from '@/components/coaching/clients/CommandBrief';

export default function ClientTargetStrategy({
  client,
  form,
  strategyView,
  setStrategyView,
  handleGenerateStrategy,
  generatingStrategy,
  handleFeedback,
  onChange,
}) {
  if (strategyView === 'results' && form?.strategyBrief) {
    return (
      <CommandBrief
        clientId={client?.id}
        clientName={client?.name}
        generatedAt={form.strategyBrief?.generatedAt || client?.updatedAt}
        strategyBrief={form.strategyBrief}
        onEditInputs={() => setStrategyView('input')}
        onFeedback={handleFeedback}
      />
    );
  }

  return (
    <div>
      Target Strategy generation overlay will go here.
    </div>
  );
}