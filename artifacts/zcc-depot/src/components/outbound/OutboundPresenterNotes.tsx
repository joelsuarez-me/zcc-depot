import { useDepot } from "@/lib/depot-mode";
import { usePresenterContent } from "@/hooks/use-presenter-content";
import { PresenterGate } from "@/components/presenter";
import type { OutboundRoomId } from "@/data/outbound-content";

/** Private talk track. Rendered only from the protected server response; nothing private ships in the bundle. */
function Notes({ roomId }: { roomId: OutboundRoomId }) {
  const { data, isLoading, isError, refetch } = usePresenterContent();
  if (isLoading) return <div className="cb-skel" data-testid="presenter-loading"><i /><i /><i /></div>;
  if (isError) return <div className="rt-notes">Presenter notes could not be loaded. <button type="button" className="underline" onClick={() => refetch()} data-testid={`button-presenter-retry-${roomId}`}>Retry</button></div>;
  const room = data?.rooms.find((r) => r.id === roomId);
  if (!room) return <div className="rt-notes">No presenter notes are published for this section yet.</div>;
  const L = ({ h, xs }: { h: string; xs: string[] }) => xs.length ? <><h4>{h}</h4><ul className="list-disc pl-5">{xs.map((x) => <li key={x}>{x}</li>)}</ul></> : null;
  return (
    <div className="rt-notes" data-testid={`presenter-notes-${roomId}`}>
      <span className="rt-h">Presenter · {room.title}</span>
      <L h="Talk track" xs={room.speakerNotes} />
      <L h="Technical points" xs={room.technicalPoints} />
      <L h="Discovery questions" xs={room.discoveryQuestions} />
      {room.objections.length > 0 && <><h4>Objections</h4>{room.objections.map((o) => <p key={o.question} className="mb-1"><b>{o.question}</b> {o.answer}</p>)}</>}
      <L h="Progression" xs={room.progression} />
    </div>
  );
}

export function OutboundPresenterNotes({ roomId, title }: { roomId: OutboundRoomId; title: string }) {
  const { isPresenter } = useDepot();
  if (!isPresenter) return null;
  return <PresenterGate title={title} detail="Presenter notes for this lab are only served to signed-in portal users."><Notes roomId={roomId} /></PresenterGate>;
}
