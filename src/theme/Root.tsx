import {type ReactNode, useEffect} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import {
  changeTayaChatBotTheme,
  installTayaBotChat,
} from '../../taya-bot';

type TayaCustomFields = {
  tayaChatBotEntryPoint?: string;
  tayaChatBotTheme?: 'light' | 'dark' | '';
  tayaChatBotOpenOnLoad?: string;
};

export default function Root({children}: {children: ReactNode}) {
  const {siteConfig, i18n} = useDocusaurusContext();
  const customFields = (siteConfig.customFields ?? {}) as TayaCustomFields;

  const entryPoint = customFields.tayaChatBotEntryPoint ?? '';
  const locale = i18n.currentLocale ?? 'ru';
  const configuredTheme = customFields.tayaChatBotTheme;
  const theme = configuredTheme || 'light';
  const openOnLoad = customFields.tayaChatBotOpenOnLoad === 'true';

  useEffect(() => {
    if (!entryPoint) {
      return;
    }

    return installTayaBotChat({
      entryPoint,
      locale,
      theme,
      openOnLoad,
    });
  }, [entryPoint, locale, openOnLoad, theme]);

  useEffect(() => {
    changeTayaChatBotTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (configuredTheme) {
      return;
    }

    const syncTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      if (currentTheme === 'dark' || currentTheme === 'light') {
        changeTayaChatBotTheme(currentTheme);
      }
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      observer.disconnect();
    };
  }, [configuredTheme]);

  return <>{children}</>;
}
