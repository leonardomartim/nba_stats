import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { SEED_TEAMS, SEED_PLAYERS, SEED_GAMES, SEED_PLAYER_STATS, SEED_STANDINGS } from "./seed-data";
import { env } from "../config/env";

export async function runSeed(db?: any) {
  let client: any = null;
  let targetDb = db;

  if (!targetDb) {
    if (!env.DATABASE_URL) {
      console.log("No DATABASE_URL available to seed PostgreSQL.");
      return;
    }
    client = postgres(env.DATABASE_URL);
    targetDb = drizzle(client, { schema });
  }

  console.log("🌱 Seeding database with NBA initial dataset...");

  try {
    // 1. Seed Teams
    for (const t of SEED_TEAMS) {
      await targetDb
        .insert(schema.teams)
        .values({
          id: t.id,
          externalId: t.externalId,
          name: t.name,
          city: t.city,
          fullName: t.fullName,
          abbreviation: t.abbreviation,
          conference: t.conference,
          division: t.division,
          logoUrl: t.logoUrl,
          primaryColor: t.primaryColor,
          secondaryColor: t.secondaryColor,
        })
        .onConflictDoUpdate({
          target: schema.teams.id,
          set: { fullName: t.fullName, primaryColor: t.primaryColor },
        });
    }
    console.log(`✅ Seeded ${SEED_TEAMS.length} NBA teams.`);

    // 2. Seed Players
    for (const p of SEED_PLAYERS) {
      await targetDb
        .insert(schema.players)
        .values({
          id: p.id,
          externalId: p.externalId,
          firstName: p.firstName,
          lastName: p.lastName,
          fullName: p.fullName,
          position: p.position,
          jerseyNumber: p.jerseyNumber,
          height: p.height,
          weight: p.weight,
          teamId: p.teamId,
          avatarUrl: p.avatarUrl,
          college: p.college,
          country: p.country,
        })
        .onConflictDoUpdate({
          target: schema.players.id,
          set: { position: p.position, jerseyNumber: p.jerseyNumber },
        });
    }
    console.log(`✅ Seeded ${SEED_PLAYERS.length} players.`);

    // 3. Seed Games & Game Scores
    for (const g of SEED_GAMES) {
      await targetDb
        .insert(schema.games)
        .values({
          id: g.id,
          externalId: g.externalId,
          date: g.date,
          season: g.season,
          status: g.status,
          statusDetail: g.statusDetail,
          period: g.period,
          clock: g.clock,
          homeTeamId: g.homeTeamId,
          homeTeamScore: g.homeTeamScore,
          visitorTeamId: g.visitorTeamId,
          visitorTeamScore: g.visitorTeamScore,
          arena: g.arena,
          city: g.city,
          isLive: g.isLive,
        })
        .onConflictDoUpdate({
          target: schema.games.id,
          set: {
            homeTeamScore: g.homeTeamScore,
            visitorTeamScore: g.visitorTeamScore,
            status: g.status,
            period: g.period,
            clock: g.clock,
            isLive: g.isLive,
          },
        });

      if (g.scores) {
        // Home score breakdown
        await targetDb
          .insert(schema.gameScores)
          .values({
            id: `${g.id}_home`,
            gameId: g.id,
            teamId: g.homeTeamId,
            isHome: true,
            q1: g.scores.home.q1,
            q2: g.scores.home.q2,
            q3: g.scores.home.q3,
            q4: g.scores.home.q4,
            ot: g.scores.home.ot,
            totalScore: g.homeTeamScore,
          })
          .onConflictDoNothing();

        // Visitor score breakdown
        await targetDb
          .insert(schema.gameScores)
          .values({
            id: `${g.id}_vis`,
            gameId: g.id,
            teamId: g.visitorTeamId,
            isHome: false,
            q1: g.scores.visitor.q1,
            q2: g.scores.visitor.q2,
            q3: g.scores.visitor.q3,
            q4: g.scores.visitor.q4,
            ot: g.scores.visitor.ot,
            totalScore: g.visitorTeamScore,
          })
          .onConflictDoNothing();
      }
    }
    console.log(`✅ Seeded ${SEED_GAMES.length} games.`);

    // 4. Seed Player Game Stats
    for (const s of SEED_PLAYER_STATS) {
      await targetDb
        .insert(schema.playerGameStats)
        .values({
          id: s.id,
          gameId: s.gameId,
          playerId: s.playerId,
          teamId: s.teamId,
          min: s.min,
          pts: s.pts,
          reb: s.reb,
          ast: s.ast,
          stl: s.stl,
          blk: s.blk,
          turnover: s.turnover,
          fgm: s.fgm,
          fga: s.fga,
          fgPct: s.fgPct.toString(),
          fg3m: s.fg3m,
          fg3a: s.fg3a,
          fg3Pct: s.fg3Pct.toString(),
          ftm: s.ftm,
          fta: s.fta,
          ftPct: s.ftPct.toString(),
          plusMinus: s.plusMinus,
        })
        .onConflictDoNothing();
    }
    console.log(`✅ Seeded ${SEED_PLAYER_STATS.length} player stats records.`);

    // 5. Seed Standings
    for (const st of SEED_STANDINGS) {
      await targetDb
        .insert(schema.teamStandings)
        .values({
          id: st.id,
          teamId: st.teamId,
          season: st.season,
          conference: st.conference,
          division: st.division,
          conferenceRank: st.conferenceRank,
          divisionRank: st.divisionRank,
          wins: st.wins,
          losses: st.losses,
          winPct: st.winPct.toString(),
          gamesBehind: st.gamesBehind.toString(),
          homeRecord: st.homeRecord,
          awayRecord: st.awayRecord,
          lastTen: st.lastTen,
          streak: st.streak,
          pointDifferential: st.pointDifferential.toString(),
        })
        .onConflictDoNothing();
    }
    console.log(`✅ Seeded ${SEED_STANDINGS.length} team standings.`);

    console.log("✨ Seeding completed successfully.");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// If run directly
if (import.meta.main) {
  runSeed().then(() => process.exit(0));
}
