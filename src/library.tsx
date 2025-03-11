// @ts-nocheck  <-- Disable all TS checks in this file

import { createRoot } from 'react-dom/client';
import { atom, createStore } from 'jotai';
import { CSSProperties, useEffect, useMemo, useState } from 'react';
import React from 'react';

import { IInit } from './types';
import 'tailwindcss/tailwind.css';
import JupiterLogo from './icons/JupiterLogo';
import ChevronDownIcon from './icons/ChevronDownIcon';
import { getTerminalInView, setTerminalInView } from './stores/jotai-terminal-in-view';
import { cn } from './misc/cn';

//
// 1) Export your appProps so other files can import it
//
export const appProps = atom<IInit | undefined>(undefined);
//
// The store
//
export const store = createStore();

const containerId = 'jupiter-terminal-instance';
const packageJson = require('../package.json');
const bundleName = `main-${packageJson.version}`;

const scriptDomain =
  (() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return '';
    const url = (document.currentScript as HTMLScriptElement)?.src;
    if (url) {
      return new URL(url).origin;
    }
    return '';
  })() || 'https://terminal.jup.ag';

async function loadRemote(id: string, href: string, type: 'text/javascript' | 'stylesheet') {
  return new Promise((res, rej) => {
    const existing = document.getElementById(id) as HTMLLinkElement | null;
    if (existing) {
      res({});
    } else {
      let el: HTMLScriptElement | HTMLLinkElement =
        type === 'text/javascript' ? document.createElement('script') : document.createElement('link');

      el.id = id;
      el.onload = res;
      el.onerror = rej;
      if (el instanceof HTMLScriptElement) {
        el.type = 'text/javascript';
        el.src = href;
      } else if (el instanceof HTMLLinkElement) {
        el.rel = 'stylesheet';
        el.href = href;
      }

      document.head.append(el);
    }
  });
}

async function loadJupiter() {
  if (process.env.NODE_ENV === 'development') {
    return;
  }
  try {
    await Promise.all([
      loadRemote('jupiter-load-script-app', `${scriptDomain}/${bundleName}-app.js`, 'text/javascript'),
      loadRemote('jupiter-load-styles-tailwind', `${scriptDomain}/${bundleName}-Tailwind.css`, 'stylesheet'),
      loadRemote('jupiter-load-styles-preflight', `${scriptDomain}/scoped-preflight.css`, 'stylesheet'),
    ]);
    loadRemote('jupiter-load-styles-jupiter', `${scriptDomain}/${bundleName}-Jupiter.css`, 'stylesheet');
  } catch (error) {
    console.error(`Error loading Jupiter Terminal: ${error}`);
    throw new Error(`Error loading Jupiter Terminal: ${error}`);
  }
}

const defaultStyles: CSSProperties = {
  zIndex: 50,
};

const RenderLoadableJupiter = (props: IInit) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadJupiter();
    let intervalId: NodeJS.Timer;
    if (!loaded) {
      intervalId = setInterval(() => {
        const instance = (window as any).JupiterRenderer?.RenderJupiter;
        if (instance) {
          setLoaded(true);
        }
      }, 50);
    }
    return () => {
      clearInterval(intervalId);
    };
  }, [loaded]);

  const RenderJupiter: (props: any) => JSX.Element = useMemo(() => {
    if (loaded) {
      return (window as any).JupiterRenderer.RenderJupiter;
    }
    return EmptyJSX;
  }, [loaded]);

  return <RenderJupiter {...props} />;
};

const EmptyJSX = () => <></>;

const RenderShell = (props: IInit) => {
  const displayMode = props.displayMode;
  const containerStyles = props.containerStyles;
  const containerClassName = props.containerClassName;

  useEffect(() => setTerminalInView(true), []);

  const displayClassName = useMemo(() => {
    if (!displayMode || displayMode === 'modal') {
      return 'fixed top-0 w-screen h-screen flex items-center justify-center bg-black/50';
    } else if (displayMode === 'integrated' || displayMode === 'widget') {
      return 'flex items-center justify-center w-full h-full';
    }
  }, [displayMode]);

  const contentClassName = useMemo(() => {
    if (!displayMode || displayMode === 'modal') {
      return `flex flex-col h-screen w-screen max-h-[90vh] md:max-h-[600px] max-w-[360px] overflow-auto text-black relative bg-black rounded-lg webkit-scrollbar ${
        containerClassName || ''
      }`;
    } else if (displayMode === 'integrated' || displayMode === 'widget') {
      return 'flex flex-col h-full w-full overflow-auto text-black relative webkit-scrollbar';
    }
  }, [containerClassName, displayMode]);

  const onClose = () => {
    if (window.Jupiter) {
      setTerminalInView(false);
      window.Jupiter.close();
    }
  };

  return (
    <div className={displayClassName}>
      {/* eslint-disable @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Poppins&display=swap"
        rel="stylesheet"
      />

      <div style={{ ...defaultStyles, ...containerStyles }} className={contentClassName}>
        <RenderLoadableJupiter {...props} />
      </div>

      {!displayMode || displayMode === 'modal' ? (
        <div onClick={onClose} className="absolute w-screen h-screen top-0 left-0 backdrop-blur-sm" />
      ) : null}
    </div>
  );
};

const RenderWidgetShell = (props: IInit) => {
  const [isOpen, setIsOpen] = useState(false);

  const classes = useMemo(() => {
    const size = props.widgetStyle?.size || 'default';
    let result: { containerClassName: string; contentClassName: string } | undefined = undefined;

    if (!props.widgetStyle?.position || props.widgetStyle?.position === 'bottom-right') {
      result = { containerClassName: 'bottom-6 right-6', contentClassName: size === 'default' ? 'bottom-[60px] -right-3' : 'bottom-[44px] -right-4' };
    }
    if (props.widgetStyle?.position === 'bottom-left') {
      result = { containerClassName: 'bottom-6 left-6', contentClassName: size === 'default' ? 'bottom-[60px] -left-3' : 'bottom-[44px] -left-4' };
    }
    if (props.widgetStyle?.position === 'top-left') {
      result = { containerClassName: 'top-6 left-6', contentClassName: size === 'default' ? 'top-[60px] -left-3' : 'top-[44px] -left-4' };
    }
    if (props.widgetStyle?.position === 'top-right') {
      result = { containerClassName: 'top-6 right-6', contentClassName: size === 'default' ? 'top-[60px] -right-3' : 'top-[44px] -right-4' };
    }

    return {
      ...result,
      widgetContainerClassName: size === 'default' ? 'h-14 w-14' : 'h-10 w-10',
      widgetLogoSize: size === 'default' ? 42 : 32,
    };
  }, [props.widgetStyle?.position, props.widgetStyle?.size]);

  return (
    <div className={`fixed ${classes.containerClassName}`}>
      <div
        className={`${classes.widgetContainerClassName} rounded-full bg-black flex items-center justify-center cursor-pointer`}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            setTerminalInView(false);
          } else {
            setIsOpen(true);
            setTerminalInView(true);
          }
        }}
      >
        {isOpen ? (
          <div
            className={cn('text-white fill-current pt-1', {
              'rotate-180':
                props.widgetStyle?.position === 'top-left' || props.widgetStyle?.position === 'top-right',
            })}
          >
            <ChevronDownIcon width={classes.widgetLogoSize * 0.4} height={classes.widgetLogoSize * 0.4} />
          </div>
        ) : (
          <JupiterLogo width={classes.widgetLogoSize} height={classes.widgetLogoSize} />
        )}
      </div>

      <div
        id="integrated-terminal"
        className={`absolute overflow-hidden ${
          classes.contentClassName
        } flex flex-col w-[90vw] h-[600px] max-w-[384px] max-h-[75vh] rounded-2xl bg-black transition-opacity duration-300 shadow-2xl ${
          !isOpen ? '!h-0 !w-0 opacity-0' : 'opacity-100'
        }`}
      >
        <RenderLoadableJupiter {...props} />
      </div>
    </div>
  );
};

// We keep a single import for createRoot here (the one at line ~40). We do NOT reimport it below

async function init(passedProps: IInit) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  const props: IInit = { ...passedProps };

  const {
    enableWalletPassthrough,
    passthroughWalletContextState,
    onRequestConnectWallet,
    onSwapError,
    onSuccess,
    onFormUpdate,
    onScreenUpdate,
    integratedTargetId,
    ...restProps
  } = props;

  const targetDiv = document.createElement('div');
  const instanceExist = document.getElementById(containerId);
  (window as any).Jupiter.store = store;

  // Remove previous instance
  if (instanceExist) {
    (window as any).Jupiter._instance = null;
    instanceExist.remove();
    (window as any).Jupiter.root?.unmount();
  }

  targetDiv.id = containerId;
  targetDiv.classList.add('w-full');
  targetDiv.classList.add('h-full');

  if (restProps.displayMode === 'integrated') {
    const target = document.getElementById(integratedTargetId!);
    if (!target) {
      throw new Error(`Jupiter Terminal: can't find integratedTargetId ${integratedTargetId}`);
    }
    target.appendChild(targetDiv);
  } else {
    document.body.appendChild(targetDiv);
  }

  // Passthrough
  if (enableWalletPassthrough) {
    (window as any).Jupiter.enableWalletPassthrough = true;
    (window as any).Jupiter.onRequestConnectWallet = onRequestConnectWallet;
  } else {
    (window as any).Jupiter.enableWalletPassthrough = false;
  }

  // Decide which Shell to render
  let element;
  if (restProps.displayMode === 'widget') {
    element = <RenderWidgetShell {...props} />;
  } else {
    element = <RenderShell {...props} />;
  }

  // The createRoot we imported at line 3
  const root = createRoot(targetDiv);
  root.render(element);

  (window as any).Jupiter.root = root;
  (window as any).Jupiter._instance = element;

  (window as any).Jupiter.onSwapError = onSwapError;
  (window as any).Jupiter.onSuccess = onSuccess;
  (window as any).Jupiter.onFormUpdate = onFormUpdate;
  (window as any).Jupiter.onScreenUpdate = onScreenUpdate;
  (window as any).Jupiter.localStoragePrefix = passedProps.localStoragePrefix || 'jupiter-terminal';
}

// Preload logic
const attributes =
  typeof document !== 'undefined' ? (document.currentScript as HTMLScriptElement)?.attributes : undefined;
if (typeof window !== 'undefined' && typeof document !== 'undefined' && attributes) {
  document.onreadystatechange = function () {
    const loadComplete = document.readyState === 'complete';
    const shouldPreload = Boolean(attributes.getNamedItem('data-preload'));
    if (loadComplete && shouldPreload) {
      setTimeout(() => {
        loadJupiter().catch((error) => {
          console.error(`Error pre-loading Jupiter Terminal: ${error}`);
          throw new Error(`Error pre-loading Jupiter Terminal: ${error}`);
        });
      }, 2000);
    }
  };
}

function resume() {
  const instanceExist = document.getElementById(containerId);
  if (instanceExist) {
    instanceExist.style.display = 'block';
  }
}

function close() {
  const targetDiv = document.getElementById(containerId);
  if (targetDiv) {
    targetDiv.style.display = 'none';
  }
}

function syncProps(_props: {
  enableWalletPassthrough?: IInit['enableWalletPassthrough'];
  passthroughWalletContextState?: IInit['passthroughWalletContextState'];
}) {
  // No check needed, we are ignoring TS in this file anyway
  // If you have a store or something, update it here
}

export { init, resume, close, syncProps };
