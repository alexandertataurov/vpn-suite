import { useMemo, useState } from "react";
import { PageLayout } from "@/layout/PageLayout";
import { Button, useToast } from "@/design-system/primitives";
import { useApi } from "@/core/api/context";
import "./news.css";

type BroadcastResponse = { broadcast_id: string; status: string };
type BroadcastStatus = {
  id: string;
  status: string;
  total: number;
  sent: number;
  failed: number;
  last_error: string;
};

export function NewsPage() {
  const api = useApi();
  const toast = useToast();
  const [text, setText] = useState("");
  const [broadcastId, setBroadcastId] = useState<string | null>(null);
  const [status, setStatus] = useState<BroadcastStatus | null>(null);
  const [isSending, setIsSending] = useState(false);
  const canSend = useMemo(() => text.trim().length > 0 && !isSending, [text, isSending]);

  const send = async () => {
    if (isSending) return;
    setIsSending(true);
    try {
      const res = await api.post<BroadcastResponse>("/admin/news/broadcast", {
        text: text.trim(),
        parse_mode: "HTML",
        include_banned: false,
      });
      setBroadcastId(res.broadcast_id);
      setStatus(null);
      toast.showToast({
        variant: "success",
        title: "Рассылка поставлена в очередь",
      });
    } catch {
      toast.showToast({
        variant: "danger",
        title: "Не удалось поставить рассылку в очередь",
      });
    } finally {
      setIsSending(false);
    }
  };

  const refresh = async () => {
    if (!broadcastId) return;
    try {
      const st = await api.get<BroadcastStatus>(`/admin/news/broadcast/${broadcastId}`);
      setStatus(st);
    } catch {
      toast.showToast({
        variant: "danger",
        title: "Не удалось получить статус",
      });
    }
  };

  return (
    <PageLayout
      title="Новости"
      description="Отправка сообщений всем пользователям через Telegram."
      pageClass="news-page"
    >
      <section className="card">
        <div className="input-wrap">
          <label className="input-label">Текст новости (HTML)</label>
          <textarea
            className="input"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Например: <b>Обновление</b>…"
          />
          <span className="input-hint">
            Сообщение будет отправлено всем пользователям. Используйте аккуратно.
          </span>
        </div>
        <div className="news-page__actions">
          <Button onClick={send} disabled={!canSend}>
            {isSending ? "Отправка…" : "Отправить всем"}
          </Button>
          {broadcastId ? (
            <>
              <Button variant="secondary" onClick={refresh}>
                Обновить статус
              </Button>
              <span className="news-page__id mono">
                id: {broadcastId}
              </span>
            </>
          ) : null}
        </div>
        {status ? (
          <div className="card news-page__status">
            <div>Статус: {status.status}</div>
            <div>
              Отправлено: {status.sent} / {status.total} (ошибок: {status.failed})
            </div>
            {status.last_error ? <div>Последняя ошибка: {status.last_error}</div> : null}
          </div>
        ) : null}
      </section>
    </PageLayout>
  );
}
