import type { NBADataProvider } from "./nba-provider.interface";
import { BallDontLieProvider } from "./balldontlie.provider";
import { MockNBAProvider } from "./mock.provider";
import { env } from "../infrastructure/config/env";

export class ProviderFactory {
  private static instance: NBADataProvider | null = null;

  public static getProvider(): NBADataProvider {
    if (!ProviderFactory.instance) {
      if (env.NBA_PROVIDER === "balldontlie" && env.BALLDONTLIE_API_KEY) {
        console.log("🏀 [Provider] Initializing BallDontLieProvider (Live External API)");
        ProviderFactory.instance = new BallDontLieProvider(env.BALLDONTLIE_API_KEY);
      } else {
        if (env.NBA_PROVIDER === "balldontlie" && !env.BALLDONTLIE_API_KEY) {
          console.warn("⚠️ BALLDONTLIE_API_KEY not configured. Falling back to MockNBAProvider for development/demo.");
        } else {
          console.log("🏀 [Provider] Initializing MockNBAProvider (Demonstrative Live Sim)");
        }
        ProviderFactory.instance = new MockNBAProvider();
      }
    }

    return ProviderFactory.instance;
  }

  public static setProvider(provider: NBADataProvider): void {
    ProviderFactory.instance = provider;
  }
}
