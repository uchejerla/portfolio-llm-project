import { useCallback, useEffect, useRef, useState } from "react";
import type { Chat, ChatMessage, Portfolio, ServerStatus, TemplateId } from "./portfolio/types";
import { emptyPortfolio, initialsFrom, slugify } from "./portfolio/normalize";
import { TEMPLATE_BY_ID } from "./portfolio/templates/meta";
import { renderPortfolio } from "./portfolio/render";
import { Sidebar } from "./components/Sidebar";
import { ChatView } from "./components/ChatView";
import { Studio } from "./components/Studio";
import { TemplateGallery } from "./components/TemplateGallery";
import { SettingsDialog } from "./components/SettingsDialog";
import { AccountDialog } from "./components/AccountDialog";
import { SignInWall, StudioBoot } from "./components/SignInWall";
import type { Attachment, SendMeta, ToastMessage } from "./lib/types";
import type { AccountIntent, AccountState } from "./lib/account";
import { fetchAccount } from "./lib/account";
import { fetchStatus, streamChat } from "./lib/chatApi";
import { deletePortfolio, listPortfolios, PortfolioApiError, savePortfolio } from "./lib/portfolioApi";
import {
  loadChats,
  loadStudioOpen,
  loadTheme,
  saveChats,
  saveStudioOpen,
  saveTheme,
  titleFromPrompt,
} from "./lib/storage";

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoaded, setChatsLoaded] = useState(false);
  const [loadedScope, setLoadedScope] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [scratchPortfolio, setScratchPortfolio] = useState<Portfolio | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(loadTheme);
  const [studioOpen, setStudioOpen] = useState<boolean>(loadStudioOpen);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [streamChatId, setStreamChatId] = useState<string | null>(null);
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [account, setAccount] = useState<AccountState | null>(null);
  const [accountLoaded, setAccountLoaded] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountIntent, setAccountIntent] = useState<AccountIntent>("account");
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const streamTextRef = useRef("");
  const pendingPortfolioRef = useRef<Portfolio | null>(null);
  const toastTimer = useRef<number | null>(null);
  const chatsRef = useRef<Chat[]>([]);
  const syncedUserRef = useRef<string | null>(null);
  const saveTimersRef = useRef<Map<string, number>>(new Map());
  const deleteTimersRef = useRef<Map<string, number>>(new Map());

  const activeChat = chats.find((chat) => chat.id === activeId) ?? null;
  const portfolio = activeChat?.portfolio ?? scratchPortfolio;
  const accountScope = account ? (account.user?.id ?? "local") : null;
  const scopeReady = Boolean(account) && chatsLoaded && accountScope === loadedScope;
  const canSync = Boolean(account?.authEnabled && account.user);
  const canExport = !account?.authEnabled || !account.billingEnabled || account.access?.plan === "pro";

  useEffect(() => {
    if (!chatsLoaded || !loadedScope) return;
    saveChats(chats, loadedScope);
  }, [chats, chatsLoaded, loadedScope]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    saveStudioOpen(studioOpen);
  }, [studioOpen]);

  useEffect(() => {
    let cancelled = false;
    void fetchStatus().then((next) => {
      if (!cancelled) setStatus(next);
    });
    void fetchAccount().then((next) => {
      if (cancelled) return;
      setAccount(next);
      setAccountLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!account) return;
    const scope = account.user?.id ?? "local";
    if (loadedScope === scope) return;
    for (const timer of saveTimersRef.current.values()) window.clearTimeout(timer);
    saveTimersRef.current.clear();
    for (const timer of deleteTimersRef.current.values()) window.clearTimeout(timer);
    deleteTimersRef.current.clear();

    let loaded = loadChats(scope);
    if (scope !== "local" && loaded.length === 0) {
      // Claim work made before accounts were switched on, exactly once.
      const legacy = loadChats("local");
      if (legacy.length) {
        loaded = legacy;
        saveChats(legacy, scope);
        saveChats([], "local");
      }
    }
    syncedUserRef.current = null;
    setChats(loaded);
    setChatsLoaded(true);
    setLoadedScope(scope);
    setActiveId(loaded[0]?.id ?? null);
    setScratchPortfolio(null);
  }, [account, loadedScope]);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    if (account?.access?.plan !== "pro") return;
    setChats((current) =>
      current.some((chat) => chat.expiresAt)
        ? current.map((chat) => (chat.expiresAt ? { ...chat, expiresAt: null } : chat))
        : current,
    );
  }, [account?.access?.plan]);

  useEffect(() => {
    if (!chatsLoaded) return;
    if (activeId && !chats.some((chat) => chat.id === activeId)) {
      setActiveId(chats[0]?.id ?? null);
      setScratchPortfolio(null);
    }
  }, [chats, activeId, chatsLoaded]);

  const notify = useCallback((text: string, actionLabel?: string, action?: () => void) => {
    setToast({ id: makeId(), text, actionLabel, action });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4800);
  }, []);

  const refreshAccount = useCallback(async (): Promise<void> => {
    const next = await fetchAccount();
    setAccount(next);
    setAccountLoaded(true);
  }, []);

  const saveNow = useCallback(
    async (chatId: string, title: string, next: Portfolio) => {
      if (!canSync) return;
      try {
        const stored = await savePortfolio(chatId, title, next);
        setChats((current) =>
          current.map((chat) =>
            chat.id === chatId ? { ...chat, expiresAt: stored.expiresAt } : chat,
          ),
        );
      } catch (error) {
        if (error instanceof PortfolioApiError && error.status === 410) {
          setChats((current) => current.filter((chat) => chat.id !== chatId));
          notify("That trial portfolio passed its 14-day limit and was permanently deleted.");
        }
      }
    },
    [canSync, notify],
  );

  const saveNowRef = useRef(saveNow);
  useEffect(() => {
    saveNowRef.current = saveNow;
  }, [saveNow]);

  const queueSave = useCallback(
    (chatId: string, title: string, next: Portfolio, immediate = false) => {
      if (!canSync) return;
      const timers = saveTimersRef.current;
      const pending = timers.get(chatId);
      if (pending) window.clearTimeout(pending);
      if (immediate) {
        timers.delete(chatId);
        void saveNow(chatId, title, next);
        return;
      }
      timers.set(
        chatId,
        window.setTimeout(() => {
          timers.delete(chatId);
          void saveNow(chatId, title, next);
        }, 700),
      );
    },
    [canSync, saveNow],
  );

  const queueServerDelete = useCallback(
    (chatId: string) => {
      if (!canSync) return;
      const timers = deleteTimersRef.current;
      const pending = timers.get(chatId);
      if (pending) window.clearTimeout(pending);
      timers.set(
        chatId,
        window.setTimeout(() => {
          timers.delete(chatId);
          void deletePortfolio(chatId);
        }, 5000),
      );
    },
    [canSync],
  );

  const cancelServerDelete = useCallback((chatId: string) => {
    const timer = deleteTimersRef.current.get(chatId);
    if (timer) {
      window.clearTimeout(timer);
      deleteTimersRef.current.delete(chatId);
    }
  }, []);

  useEffect(
    () => () => {
      for (const timer of saveTimersRef.current.values()) window.clearTimeout(timer);
      for (const timer of deleteTimersRef.current.values()) window.clearTimeout(timer);
    },
    [],
  );

  const openAccount = useCallback((intent: AccountIntent = "account") => {
    setAccountIntent(intent);
    setAccountOpen(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auth = params.get("auth");
    const billing = params.get("billing");
    if (!auth && !billing) return;

    const clean = new URL(window.location.href);
    clean.searchParams.delete("auth");
    clean.searchParams.delete("billing");
    window.history.replaceState({}, "", `${clean.pathname}${clean.search}${clean.hash}`);

    let timer: number | null = null;
    if (auth === "success") {
      setAuthError(false);
      void refreshAccount();
      notify("Signed in with Google.");
    } else if (auth === "error") {
      setAuthError(true);
      notify("Google sign-in didn't finish. Please try again.");
    }

    if (billing === "success") {
      notify("Payment received — activating your plan…");
      let attempts = 0;
      timer = window.setInterval(async () => {
        attempts += 1;
        const next = await fetchAccount();
        if (next) setAccount(next);
        if (next?.access?.plan === "pro" || attempts >= 5) {
          if (timer) window.clearInterval(timer);
          if (next?.access?.plan === "pro") notify("Studio Pro is active. Welcome in.");
        }
      }, 1500);
    } else if (billing === "cancel") {
      notify("Checkout cancelled. Your trial is unchanged.");
    } else if (billing === "portal") {
      void refreshAccount();
    }

    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [notify, refreshAccount]);

  useEffect(() => {
    const userId = account?.authEnabled ? account.user?.id ?? null : null;
    if (!userId || !chatsLoaded || !scopeReady) return;
    if (syncedUserRef.current === userId) return;
    syncedUserRef.current = userId;
    let cancelled = false;

    void (async () => {
      const result = await listPortfolios();
      if (cancelled) return;
      if (!result) {
        syncedUserRef.current = null;
        return;
      }

      const expired = new Set(result.expiredIds);
      const remote = new Map(result.projects.map((project) => [project.id, project]));
      const replacements = new Map<
        string,
        { portfolio: Portfolio; expiresAt: number | null; updatedAt: number }
      >();
      const additions: Chat[] = [];
      const pushes: Array<{ id: string; title: string; portfolio: Portfolio }> = [];

      for (const chat of chatsRef.current) {
        if (expired.has(chat.id)) continue;
        const server = remote.get(chat.id);
        if (!server) {
          if (chat.portfolio) {
            pushes.push({ id: chat.id, title: chat.title, portfolio: chat.portfolio });
          }
          continue;
        }
        remote.delete(chat.id);
        if (server.updatedAt > chat.updatedAt) {
          replacements.set(chat.id, {
            portfolio: server.portfolio,
            expiresAt: server.expiresAt,
            updatedAt: server.updatedAt,
          });
        } else if (chat.updatedAt > server.updatedAt && chat.portfolio) {
          pushes.push({ id: chat.id, title: chat.title, portfolio: chat.portfolio });
        }
      }

      for (const server of remote.values()) {
        if (expired.has(server.id)) continue;
        additions.push({
          id: server.id,
          title: server.title || server.portfolio.name || "Portfolio",
          createdAt: server.createdAt,
          updatedAt: server.updatedAt,
          messages: [],
          portfolio: server.portfolio,
          expiresAt: server.expiresAt,
        });
      }

      if (replacements.size || additions.length || expired.size) {
        setChats((current) => {
          const next = current
            .filter((chat) => !expired.has(chat.id))
            .map((chat) => {
              const server = replacements.get(chat.id);
              return server
                ? {
                    ...chat,
                    portfolio: server.portfolio,
                    expiresAt: server.expiresAt,
                    updatedAt: Math.max(chat.updatedAt, server.updatedAt),
                  }
                : chat;
            });
          const existing = new Set(next.map((chat) => chat.id));
          for (const addition of additions) {
            if (!existing.has(addition.id)) next.push(addition);
          }
          return next.sort((a, b) => b.updatedAt - a.updatedAt);
        });
      }

      if (expired.size) {
        notify(
          expired.size === 1
            ? "A trial portfolio passed its 14-day limit and was permanently deleted."
            : `${expired.size} trial portfolios passed their 14-day limit and were permanently deleted.`,
        );
      }
      for (const push of pushes) {
        void saveNowRef.current(push.id, push.title, push.portfolio);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [account?.authEnabled, account?.user?.id, chatsLoaded, scopeReady, notify]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setActiveId(null);
    setScratchPortfolio(null);
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        newChat();
      }
      if (event.key === "Escape") {
        if (galleryOpen || settingsOpen || sidebarOpen) {
          setGalleryOpen(false);
          setSettingsOpen(false);
          setSidebarOpen(false);
        } else if (window.innerWidth < 1100) {
          setStudioOpen(false);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [newChat, galleryOpen, settingsOpen, sidebarOpen]);

  const selectChat = (id: string) => {
    if (id === activeId) {
      setSidebarOpen(false);
      return;
    }
    abortRef.current?.abort();
    setActiveId(id);
    setScratchPortfolio(null);
    setSidebarOpen(false);
  };

  const deleteChat = (id: string) => {
    const previous = chats;
    const removed = chats.find((chat) => chat.id === id) ?? null;
    const remaining = chats.filter((chat) => chat.id !== id);
    setChats(remaining);
    if (activeId === id) {
      if (streamChatId === id) abortRef.current?.abort();
      setActiveId(remaining[0]?.id ?? null);
    }
    queueServerDelete(id);
    notify("Conversation deleted.", "Undo", () => {
      cancelServerDelete(id);
      setChats(previous);
      setActiveId(id);
      if (removed?.portfolio) queueSave(id, removed.title, removed.portfolio, true);
    });
  };

  const updatePortfolio = (next: Portfolio) => {
    if (activeChat) {
      const now = Date.now();
      setChats((current) =>
        current.map((chat) =>
          chat.id === activeChat.id
            ? { ...chat, portfolio: next, updatedAt: now }
            : chat,
        ),
      );
      queueSave(activeChat.id, activeChat.title, next);
    } else {
      setScratchPortfolio(next);
    }
  };

  const chooseTemplate = (id: TemplateId) => {
    const meta = TEMPLATE_BY_ID[id];
    const base = portfolio ?? emptyPortfolio();
    updatePortfolio({
      ...base,
      template: id,
      accent: meta.defaultAccent,
      initials: base.initials || initialsFrom(base.name),
    });
    setGalleryOpen(false);
    setStudioOpen(true);
  };

  const changeAccent = (accent: string) => {
    if (!portfolio) return;
    updatePortfolio({ ...portfolio, accent });
  };

  const accessNotice: "signin" | "upgrade" | null =
    status?.ready && account?.billingEnabled
      ? account.user
        ? account.access && !account.access.canGenerate
          ? "upgrade"
          : null
        : "signin"
      : null;

  const sendMessage = async (text: string, attachments: Attachment[], meta?: SendMeta) => {
    const clean = text.trim();
    if (!clean || streaming) return;
    if (accessNotice) {
      openAccount(accessNotice);
      notify(
        accessNotice === "signin"
          ? "Sign in with Google to start your free trial."
          : "Your trial has ended. Upgrade to keep writing with Claude.",
      );
      return;
    }

    const now = Date.now();
    let chat = activeChat;
    let chatId = chat?.id ?? "";

    if (!chat) {
      const newChatRecord: Chat = {
        id: makeId(),
        title: titleFromPrompt(clean),
        createdAt: now,
        updatedAt: now,
        messages: [],
        portfolio: scratchPortfolio,
      };
      chat = newChatRecord;
      chatId = newChatRecord.id;
      setChats((current) => [newChatRecord, ...current]);
      setActiveId(newChatRecord.id);
      setScratchPortfolio(null);
    }

    const attachmentNames = attachments.map((file) => `📎 ${file.name}`).join("\n");
    const displayContent = attachmentNames ? `${clean}\n\n${attachmentNames}` : clean;
    const shownContent = meta?.display
      ? attachmentNames
        ? `${meta.display}\n\n${attachmentNames}`
        : meta.display
      : displayContent;
    const requestContent = attachments.length
      ? `${clean}\n\n${attachments
          .map((file) => `--- Attached brief: ${file.name} ---\n${file.text}`)
          .join("\n\n")}`
      : clean;

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      content: shownContent,
      createdAt: now,
    };

    const basePortfolio = chat.portfolio ?? scratchPortfolio;
    const title = chat.messages.length
      ? chat.title
      : meta?.title ?? titleFromPrompt(clean);

    setChats((current) =>
      current.map((item) =>
        item.id === chatId
          ? {
              ...item,
              title,
              messages: [...item.messages, userMessage],
              updatedAt: now,
              portfolio: basePortfolio,
            }
          : item,
      ),
    );

    const history = [...chat.messages, userMessage]
      .map((message, index) => ({
        role: message.role,
        content:
          index === chat!.messages.length ? requestContent : message.content,
      }))
      .slice(-12);

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    setStreamText("");
    streamTextRef.current = "";
    pendingPortfolioRef.current = null;
    setStreamChatId(chatId);
    if (window.innerWidth >= 1100) setStudioOpen(true);

    let committed = false;
    const commit = (message: string, options: { error?: boolean; portfolio?: Portfolio | null } = {}) => {
      if (committed) return;
      committed = true;
      const assistantMessage: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: message,
        createdAt: Date.now(),
        error: options.error,
      };
      setChats((current) =>
        current.map((item) =>
          item.id === chatId
            ? {
                ...item,
                messages: [...item.messages, assistantMessage],
                updatedAt: Date.now(),
                portfolio: options.portfolio ?? item.portfolio,
              }
            : item,
        ),
      );
      if (options.portfolio) queueSave(chatId, title, options.portfolio, true);
    };

    try {
      await streamChat(
        {
          messages: history,
          portfolio: basePortfolio,
          signal: controller.signal,
        },
        {
          onText: (value) => {
            streamTextRef.current = value;
            setStreamText(value);
          },
          onPortfolio: (value) => {
            pendingPortfolioRef.current = value;
          },
          onDone: ({ message, portfolio: finalPortfolio }) => {
            const resolved = finalPortfolio ?? pendingPortfolioRef.current ?? basePortfolio;
            const fallback = streamTextRef.current.trim() || "Your portfolio is ready in the studio.";
            commit(message.trim() || fallback, { portfolio: resolved });
          },
          onError: (message) => {
            commit(message, { error: true });
          },
          onAccessDenied: (code, message) => {
            commit(message, { error: true });
            setAccountIntent(code === "trial_expired" ? "upgrade" : "signin");
            setAccountOpen(true);
            void refreshAccount();
          },
        },
      );
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        const partial = streamTextRef.current.trim();
        commit(partial || "Stopped. Tell me where to pick up.", {
          portfolio: pendingPortfolioRef.current ?? undefined,
        });
      } else {
        commit("Something went wrong while writing. Try again in a moment.", { error: true });
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
      setStreamText("");
      streamTextRef.current = "";
      setStreamChatId(null);
    }
  };

  const exportPortfolio = () => {
    if (!portfolio) return;
    if (!canExport) {
      openAccount("upgrade");
      notify(
        account?.priceLabel
          ? `HTML downloads unlock with Studio Pro — ${account.priceLabel}.`
          : "Upgrade to Studio Pro to download your portfolio.",
      );
      return;
    }
    const html = renderPortfolio(portfolio);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugify(portfolio.name)}-${portfolio.template}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    notify("Portfolio exported as a standalone HTML file.");
  };

  const openPortfolio = () => {
    if (!portfolio) return;
    const blob = new Blob([renderPortfolio(portfolio)], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const copyBlueprint = async () => {
    if (!portfolio) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(portfolio, null, 2));
      notify("Blueprint JSON copied.");
    } catch {
      notify("Clipboard access was blocked.");
    }
  };

  const toggleTheme = () => setTheme((current) => (current === "light" ? "dark" : "light"));

  if (!accountLoaded) return <StudioBoot />;
  if (!account) {
    return <StudioBoot error onRetry={() => void refreshAccount()} />;
  }
  if (account.authEnabled && !account.user) {
    return <SignInWall account={account} authError={authError} />;
  }
  if (!scopeReady) return <StudioBoot />;

  return (
    <div className="app">
      <div
        className={`sidebar-shell ${sidebarOpen ? "is-open" : ""}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSidebarOpen(false);
        }}
      >
        <Sidebar
          chats={chats}
          activeId={activeId}
          status={status}
          theme={theme}
          onNewChat={newChat}
          onSelectChat={selectChat}
          onDeleteChat={deleteChat}
          onToggleTheme={toggleTheme}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenAccount={() => openAccount()}
          account={account}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <div className="workspace">
        <ChatView
          chat={activeChat}
          streaming={streaming}
          streamText={streamText}
          status={status}
          studioOpen={studioOpen}
          hasPortfolio={Boolean(portfolio)}
          onSend={sendMessage}
          onStop={stopStreaming}
          onToggleStudio={() => setStudioOpen((open) => !open)}
          onOpenGallery={() => setGalleryOpen(true)}
          onOpenStudio={() => setStudioOpen(true)}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenAccount={openAccount}
          account={account}
          accessNotice={accessNotice}
        />

        {studioOpen && (
          <Studio
            portfolio={portfolio}
            expiresAt={activeChat?.expiresAt ?? null}
            exportLocked={!canExport}
            onChooseTemplate={chooseTemplate}
            onOpenGallery={() => setGalleryOpen(true)}
            onAccent={changeAccent}
            onClose={() => setStudioOpen(false)}
            onExport={exportPortfolio}
            onOpen={openPortfolio}
            onCopy={copyBlueprint}
          />
        )}
      </div>

      {galleryOpen && (
        <TemplateGallery
          active={portfolio?.template ?? null}
          onSelect={chooseTemplate}
          onClose={() => setGalleryOpen(false)}
        />
      )}

      {settingsOpen && (
        <SettingsDialog status={status} onClose={() => setSettingsOpen(false)} />
      )}

      {accountOpen && (
        <AccountDialog
          account={account}
          intent={accountIntent}
          onClose={() => setAccountOpen(false)}
          onRefresh={refreshAccount}
          notify={notify}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          <span>{toast.text}</span>
          {toast.action && toast.actionLabel && (
            <button
              type="button"
              onClick={() => {
                toast.action?.();
                setToast(null);
              }}
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
