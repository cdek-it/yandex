type ChatTheme = 'dark' | 'light';

type RenderComponentToBodyParams = {
  entryPoint: string;
  locale: string;
  theme?: ChatTheme;
};

type ChatBotModule = {
  renderComponentToBody: (params: RenderComponentToBodyParams) => void;
};

const CDEK_CHAT_BOT_MODULE_URL =
  'https://public-static.cdek.ru/chat-bot/releases/latest/main.mjs';

let chatBotModulePromise: Promise<ChatBotModule> | null = null;

function loadChatBotModule(): Promise<ChatBotModule> {
  if (!chatBotModulePromise) {
    chatBotModulePromise = import(
      /* webpackIgnore: true */ CDEK_CHAT_BOT_MODULE_URL
    ) as Promise<ChatBotModule>;
  }

  return chatBotModulePromise;
}

type InstallTayaBotChatParams = {
  entryPoint: string;
  locale: string;
  theme?: ChatTheme;
  openOnLoad?: boolean;
};

type TayaChatBotEventData = {
  type?: string;
  func?: 'ready';
};

function getTargetOrigin(): string {
  const origin = window.location.origin;
  return origin === 'null' ? '*' : origin;
}

function postChatBotMessage(payload: Record<string, unknown>): void {
  window.postMessage({type: 'chat-bot', ...payload}, getTargetOrigin());
}

function isTrustedReadyEvent(event: MessageEvent): boolean {
  const data = event.data as TayaChatBotEventData | undefined;
  if (!data || data.type !== 'chat-bot' || data.func !== 'ready') {
    return false;
  }

  return event.source === window && event.origin === window.location.origin;
}

export const installTayaBotChat = ({
  entryPoint,
  locale,
  theme,
  openOnLoad = false,
}: InstallTayaBotChatParams): (() => void) => {
  if (!entryPoint) {
    return () => undefined;
  }

  let isDisposed = false;

  const onMessage = (event: MessageEvent) => {
    if (!isTrustedReadyEvent(event)) {
      return;
    }

    postChatBotMessage({
      action: 'sync',
      locale,
      theme,
      entryPoint,
    });

    if (openOnLoad) {
      postChatBotMessage({action: 'open'});
    }
  };

  window.addEventListener('message', onMessage);

  void loadChatBotModule()
    .then(({renderComponentToBody}) => {
      if (isDisposed) {
        return;
      }

      renderComponentToBody({
        entryPoint,
        locale,
        theme,
      });
    })
    .catch((error: unknown) => {
      window.removeEventListener('message', onMessage);
      // Keep docs rendering even if chat-bot CDN is temporarily unavailable.
      console.error('Failed to load CDEK chat-bot module', error);
    });

  return () => {
    isDisposed = true;
    window.removeEventListener('message', onMessage);
  };
};

export const changeTayaChatBotTheme = (theme: ChatTheme): void => {
  postChatBotMessage({action: 'theme-update', theme});
};