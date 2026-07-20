import CommandBrief from "@/components/coaching/clients/CommandBrief";

export default function ClientTargetStrategy({ client }) {
  return (
    <CommandBrief
      clientId={client?.id}
      clientName={client?.name}
      generatedAt={client?.strategyGeneratedAt}
      strategyBrief={client?.strategyJson}
    />
  );
}