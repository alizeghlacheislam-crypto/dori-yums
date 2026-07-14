import type { CSGORaw } from 'csgogsi';
import { GSI } from './socket';
import { actions } from './actions';

/**
 * Demo feed: activate with `?demo=1` to develop and stage the HUD without a
 * running game or LHM instance. Generates a deterministic-but-lively mid-round
 * state, ticking a few times per second like real GSI.
 */

const CT_NAMES = ['s1ren', 'karrigan', 'device', 'ropz', 'frozen'];
const T_NAMES = ['donk', 'zont1x', 'sh1ro', 'magixx', 'chopper'];
const CT_COUNTRIES = ['SE', 'DK', 'DK', 'EE', 'SK'];
const T_COUNTRIES = ['RU', 'RU', 'RU', 'RU', 'RU'];
const CT_WEAPONS = ['m4a1_silencer', 'awp', 'm4a1', 'famas', 'm4a1_silencer'];
const T_WEAPONS = ['ak47', 'awp', 'ak47', 'galilar', 'ak47'];

let tick = 0;

function player(
  idx: number,
  side: 'CT' | 'T',
  name: string,
  country: string,
  weaponName: string
): Record<string, unknown> {
  const slot = side === 'CT' ? idx + 1 : idx + 6;
  const phase = tick / 8 + idx;
  const alive = side === 'CT' ? idx !== 3 : idx !== 2 && idx !== 4;
  const health = alive ? Math.max(1, Math.round(60 + 40 * Math.sin(phase))) : 0;
  const x = -1200 + Math.cos(phase * 0.35) * 900 + idx * 260;
  const y = -400 + Math.sin(phase * 0.28) * 900 + (side === 'CT' ? 700 : -500);
  return {
    steamid: `7656119800000${slot.toString().padStart(2, '0')}`,
    name,
    observer_slot: slot === 10 ? 0 : slot,
    team: side,
    match_stats: {
      kills: 5 + ((idx * 3 + (side === 'CT' ? 1 : 2)) % 9),
      assists: idx % 4,
      deaths: 4 + ((idx * 2) % 6),
      mvps: idx % 3,
      score: 20 + idx * 7
    },
    weapons: {
      '0': { name: 'weapon_knife', paintkit: 'default', type: 'Knife', state: 'holstered' },
      '1': {
        name: `weapon_${weaponName}`,
        paintkit: 'default',
        type: weaponName === 'awp' ? 'SniperRifle' : 'Rifle',
        ammo_clip: 17 + (idx % 12),
        ammo_clip_max: 30,
        ammo_reserve: 90,
        state: 'active'
      },
      '2': {
        name: side === 'CT' ? 'weapon_usp_silencer' : 'weapon_glock',
        paintkit: 'default',
        type: 'Pistol',
        ammo_clip: 12,
        ammo_clip_max: 12,
        ammo_reserve: 24,
        state: 'holstered'
      },
      '3': { name: 'weapon_smokegrenade', paintkit: 'default', type: 'Grenade', ammo_reserve: 1, state: 'holstered' },
      '4': { name: 'weapon_flashbang', paintkit: 'default', type: 'Grenade', ammo_reserve: 2, state: 'holstered' }
    },
    state: {
      health,
      armor: alive ? 88 : 0,
      helmet: alive,
      defusekit: side === 'CT' && idx < 2,
      flashed: alive && idx === 1 && tick % 40 < 12 ? 180 : 0,
      smoked: 0,
      burning: alive && side === 'T' && idx === 0 && tick % 60 < 10 ? 200 : 0,
      money: 1900 + idx * 950,
      round_kills: alive ? idx % 3 : 0,
      round_killhs: alive ? idx % 2 : 0,
      round_totaldmg: 35 * idx,
      equip_value: 4200 + idx * 400
    },
    position: `${x.toFixed(2)}, ${y.toFixed(2)}, ${(idx % 2 ? -80 : 40).toFixed(2)}`,
    forward: `${Math.cos(phase).toFixed(2)}, ${Math.sin(phase).toFixed(2)}, 0.00`
  };
}

const steamid = (slot: number) => `7656119800000${slot.toString().padStart(2, '0')}`;

function buildFrame(): CSGORaw {
  const allplayers: Record<string, unknown> = {};
  CT_NAMES.forEach((name, i) => {
    allplayers[steamid(i + 1)] = player(i, 'CT', name, CT_COUNTRIES[i], CT_WEAPONS[i]);
  });
  T_NAMES.forEach((name, i) => {
    allplayers[steamid(i + 6)] = player(i, 'T', name, T_COUNTRIES[i], T_WEAPONS[i]);
  });

  const roundTime = Math.max(0, 115 - (tick / 4) % 115);

  return {
    provider: {
      name: 'Counter-Strike: Global Offensive',
      appid: 730,
      version: 14023,
      steamid: '76561198000000000',
      timestamp: Math.floor(Date.now() / 1000)
    },
    map: {
      mode: 'competitive',
      name: 'de_mirage',
      phase: 'live',
      round: 17,
      team_ct: {
        score: 9,
        consecutive_round_losses: 1,
        timeouts_remaining: 3,
        matches_won_this_series: 1,
        name: 'AURORA FALCONS'
      },
      team_t: {
        score: 8,
        consecutive_round_losses: 0,
        timeouts_remaining: 4,
        matches_won_this_series: 0,
        name: 'NIGHT MARKET'
      },
      num_matches_to_win_series: 2,
      current_spectators: 0,
      souvenirs_total: 0,
      round_wins: {
        '1': 'ct_win_elimination',
        '2': 't_win_bomb',
        '3': 't_win_elimination',
        '4': 'ct_win_defuse',
        '5': 'ct_win_time',
        '6': 't_win_elimination',
        '7': 'ct_win_elimination',
        '8': 't_win_bomb',
        '9': 'ct_win_elimination',
        '10': 't_win_elimination',
        '11': 'ct_win_defuse',
        '12': 't_win_bomb',
        '13': 'ct_win_elimination',
        '14': 't_win_elimination',
        '15': 'ct_win_elimination',
        '16': 't_win_bomb',
        '17': 'ct_win_elimination'
      }
    } as CSGORaw['map'],
    round: { phase: 'live' },
    player: {
      ...(allplayers[steamid(1)] as Record<string, unknown>),
      activity: 'playing',
      spectarget: steamid(1)
    } as unknown as CSGORaw['player'],
    allplayers: allplayers as CSGORaw['allplayers'],
    bomb: {
      state: 'carried',
      player: steamid(6),
      position: '-1000.00, -300.00, -100.00'
    },
    grenades: {
      '129': {
        owner: '76561198000000002',
        position: '-1600.00, -600.00, -100.00',
        velocity: '0.00, 0.00, 0.00',
        lifetime: `${(tick % 80) / 4}`,
        type: 'smoke',
        effecttime: `${(tick % 80) / 4}`
      }
    },
    phase_countdowns: {
      phase: 'live',
      phase_ends_in: roundTime.toFixed(1)
    }
  } as CSGORaw;
}

function demoKill(): void {
  const game = GSI.current;
  if (!game) return;
  const ct = game.players.filter(p => p.team.side === 'CT' && p.state.health > 0);
  const t = game.players.filter(p => p.team.side === 'T' && p.state.health > 0);
  if (ct.length === 0 || t.length === 0) return;
  const ctKills = tick % 2 === 0;
  const killer = (ctKills ? ct : t)[tick % (ctKills ? ct.length : t.length)];
  const victim = (ctKills ? t : ct)[tick % (ctKills ? t.length : ct.length)];
  const weapon = killer.weapons.find(w => w.state === 'active')?.name.replace('weapon_', '') ?? 'ak47';
  GSI.digestMIRV(
    {
      name: 'player_death',
      clientTime: Date.now() / 1000,
      keys: {
        userid: { value: 1, xuid: victim.steamid },
        attacker: { value: 2, xuid: killer.steamid },
        assister: { value: 0, xuid: tick % 3 === 0 ? (ctKills ? ct : t)[0].steamid : '0' },
        assistedflash: tick % 6 === 0,
        weapon,
        weapon_itemid: '0',
        weapon_fauxitemid: '0',
        weapon_originalowner_xuid: killer.steamid,
        headshot: tick % 2 === 0,
        dominated: 0,
        revenge: 0,
        wipe: 0,
        attackerblind: tick % 9 === 0,
        thrusmoke: tick % 7 === 0,
        noscope: weapon === 'awp' && tick % 5 === 0,
        penetrated: tick % 8 === 0 ? 1 : 0,
        noreplay: false,
        attackerinair: tick % 11 === 0
      }
    },
    'player_death'
  );
}

export function startDemo(): void {
  // Console helper for staging overlays without LHM: hudAction('toggleStats')
  (window as Window & { hudAction?: (a: string) => void }).hudAction = a => actions.dispatch(a);
  const feed = () => {
    tick += 1;
    try {
      GSI.digest(buildFrame());
      if (tick % 16 === 0) demoKill();
    } catch (e) {
      console.error('demo digest error', e);
    }
  };
  feed();
  window.setInterval(feed, 250);
}

export const isDemoMode = (): boolean => new URLSearchParams(window.location.search).has('demo');
