interface CrazyGamesAdCallbacks {
  adStarted?: () => void;
  adFinished?: () => void;
  adError?: (error: unknown) => void;
}

interface CrazyGamesGameSettings {
  muteAudio?: boolean;
}

interface CrazyGamesSDKv3 {
  init?: () => Promise<void>;
  environment?: 'crazygames' | 'local' | 'disabled';
  game?: {
    gameplayStart?: () => void;
    gameplayStop?: () => void;
    loadingStart?: () => void;
    loadingStop?: () => void;
    happytime?: () => void;
    settings?: CrazyGamesGameSettings;
    addSettingsChangeListener?: (listener: (settings: CrazyGamesGameSettings) => void) => void;
  };
  ad?: {
    requestAd?: (type: 'midgame' | 'rewarded', callbacks?: CrazyGamesAdCallbacks) => void;
  };
}

declare global {
  interface Window {
    CrazyGames?: {
      SDK?: CrazyGamesSDKv3;
    };
  }
}

type FallbackAdHandler = (onDone: () => void) => void;

class CrazyGamesBridge {
  private initialized = false;
  private isLiveSdk = false;
  private inGameplay = false;
  private muteListener: ((muted: boolean) => void) | null = null;
  private fallbackAdHandler: FallbackAdHandler | null = null;

  public async init(onSdkMuteChange?: (muted: boolean) => void): Promise<void> {
    if (onSdkMuteChange) {
      this.muteListener = onSdkMuteChange;
    }
    if (this.initialized) return;
    this.initialized = true;

    const sdk = typeof window !== 'undefined' ? window.CrazyGames?.SDK : undefined;
    if (!sdk || typeof sdk.init !== 'function') {
      this.isLiveSdk = false;
      return;
    }

    try {
      await sdk.init();
      // CrazyGames SDK v3 sets environment to 'crazygames' or 'local' when hosted in CrazyGames QA/portal
      const env = sdk.environment;
      this.isLiveSdk = env === 'crazygames' || env === 'local';

      sdk.game?.loadingStart?.();
      sdk.game?.loadingStop?.();

      if (sdk.game?.settings?.muteAudio && this.muteListener) {
        this.muteListener(true);
      }

      sdk.game?.addSettingsChangeListener?.((settings) => {
        if (typeof settings?.muteAudio === 'boolean' && this.muteListener) {
          this.muteListener(settings.muteAudio);
        }
      });
    } catch {
      this.isLiveSdk = false;
    }
  }

  public registerFallbackAdHandler(handler: FallbackAdHandler | null): void {
    this.fallbackAdHandler = handler;
  }

  public gameplayStart(): void {
    if (this.inGameplay) return;
    this.inGameplay = true;
    try {
      window.CrazyGames?.SDK?.game?.gameplayStart?.();
    } catch {
      // ignore outside CrazyGames
    }
  }

  public gameplayStop(): void {
    if (!this.inGameplay) return;
    this.inGameplay = false;
    try {
      window.CrazyGames?.SDK?.game?.gameplayStop?.();
    } catch {
      // ignore outside CrazyGames
    }
  }

  /**
   * Requests a CrazyGames midgame ad with proper gameplayStop + audio muting.
   * Falls back to a brief local preview ad overlay when tested outside the CrazyGames portal.
   */
  public requestMidgameAd(options: {
    onAudioMute: (muted: boolean) => void;
    onComplete: () => void;
  }): void {
    this.gameplayStop();

    const sdk = typeof window !== 'undefined' ? window.CrazyGames?.SDK : undefined;
    const canUseRealSdk = this.isLiveSdk && typeof sdk?.ad?.requestAd === 'function';

    if (canUseRealSdk && sdk?.ad?.requestAd) {
      let finished = false;
      const finishOnce = () => {
        if (finished) return;
        finished = true;
        options.onAudioMute(false);
        options.onComplete();
      };

      try {
        sdk.ad.requestAd('midgame', {
          adStarted: () => {
            options.onAudioMute(true);
          },
          adFinished: () => {
            finishOnce();
          },
          adError: () => {
            finishOnce();
          },
        });
        return;
      } catch {
        finishOnce();
        return;
      }
    }

    // Standalone / preview fallback so ad-gating behavior can be tested cleanly before CrazyGames upload
    if (this.fallbackAdHandler) {
      options.onAudioMute(true);
      this.fallbackAdHandler(() => {
        options.onAudioMute(false);
        options.onComplete();
      });
    } else {
      options.onComplete();
    }
  }
}

export const crazyGamesSdk = new CrazyGamesBridge();
