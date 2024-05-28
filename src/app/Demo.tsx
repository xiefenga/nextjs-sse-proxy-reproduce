'use client'

import dayjs from "dayjs";
import { useRef, useState } from "react";
import { fetchEventSource } from "@fortaine/fetch-event-source";

enum SSEStatus {
  READY,
  CONNECTING,
  OPEN,
  CLOSED,
}

const SSEStatusText = {
  [SSEStatus.READY]: "READY",
  [SSEStatus.CONNECTING]: "CONNECTING",
  [SSEStatus.OPEN]: "OPEN",
  [SSEStatus.CLOSED]: "CLOSED",
};

interface Options {
  url: string;
  body: object;
  headers: Record<string, string>;
}

const useEventSource = ({ url, body, headers }: Options) => {
  const [status, setStatus] = useState<SSEStatus>(SSEStatus.READY);
  const [messages, setMessages] = useState<
    { raw: string; client: number; server: number }[]
  >([]);

  const ctrlRef = useRef(new AbortController());

  const request = async () => {
    setStatus(SSEStatus.CONNECTING);
    await fetchEventSource(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: ctrlRef.current.signal,
      openWhenHidden: true,
      onmessage: ({ data }) => {
        const message = JSON.parse(data);
        console.log(message.time, dayjs(dayjs(message.time).valueOf()).format('YYYY-MM-DD HH:mm:ss:SSS'))
        setMessages((messages) => [
          ...messages,
          {
            raw: data,
            client: Date.now(),
            server: dayjs(message.time).valueOf(),
          },
        ]);
      },
      onopen: async () => {
        setStatus(SSEStatus.OPEN);
      },
      onerror(err) {
        console.error(err);
        setStatus(SSEStatus.CLOSED);
        ctrlRef.current = new AbortController();
      },
      onclose() {
        setStatus(SSEStatus.CLOSED);
        ctrlRef.current = new AbortController();
      },
    });
  };

  const abort = () => {
    ctrlRef.current.abort();
    ctrlRef.current = new AbortController();
    setStatus(SSEStatus.READY);
  };

  return { status, messages, request, abort, clear: () => setMessages([]) };
};

interface DemoProps {
  url: string;
  body?: object;
  headers?: Record<string, string>;
}

const Demo = ({ url, body = {}, headers = {} }: DemoProps) => {
  const { request, messages, status, abort, clear } = useEventSource({
    url,
    body,
    headers,
  });

  return (
    <div className="border p-2 rounded">
      <div className="text-center text-2xl font-bold leading-loose">{url}</div>
      <div className="flex gap-2 items-center">
        {status === SSEStatus.OPEN ? (
          <button
            onClick={abort}
            className="py-2 px-4 my-4 rounded bg-orange-400 hover:bg-orange-500 transition-colors font-bold"
          >
           abort
          </button>
        ) : (
          <button
            onClick={request}
            className="py-2 px-4 my-4 rounded bg-slate-300 hover:bg-slate-400 transition-colors font-bold"
          >
           request
          </button>
        )}
        <span>{SSEStatusText[status]}</span>
        <button
          onClick={clear}
          className="ml-auto py-2 px-4 my-4 rounded bg-green-400 hover:bg-green-500 transition-colors font-bold"
        >
         clear
        </button>
      </div>
      <div className="border p-2 rounded border-dashed h-[800px] overflow-auto">
        {messages.length === 0 && <div>empty</div>}
        {messages.map((message, index) => (
          <div
            key={index}
            className="flex items-center border py-1 px-2 rounded my-1 gap-2"
          >
            <div className="truncate flex-1">{message.raw}</div>
            <div className="flex-shrink-0">
              <div className="font-bold">server: {dayjs(message.server).format("YYYY-MM-DD HH:mm:ss:SSS")}</div>
              <div className="font-bold">client: {dayjs(message.client).format("YYYY-MM-DD HH:mm:ss:SSS")}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Demo;
