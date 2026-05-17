import random
from itertools import combinations

teams = list(range(1, 16))
all_matchups = list(combinations(teams, 2))

slot_times = {
    1: "14:00", 2: "14:20", 3: "14:40", 4: "15:00", 5: "15:20", 6: "15:40",
    7: "16:00", 8: "16:20", 9: "16:40", 10: "17:00", 11: "17:20", 12: "17:40", 13: "18:00"
}

def get_fields(slot):
    if slot in [4, 5, 6, 10, 11, 12, 13]:
        return ["BV1", "SPK1", "SPK2"]
    return ["BV1", "BV2", "SPK1", "SPK2"]

def field_sport(f):
    return "volleyball" if f.startswith("BV") else "spikeball"

MAX_SPORT_IMBALANCE = 4  # max of one sport type (so min 2 of the other)

def solve(seed=0):
    random.seed(seed)

    # Select 45 balanced matchups
    team_count = {t: 0 for t in teams}
    candidates = list(all_matchups)
    random.shuffle(candidates)
    selected = []
    for m in candidates:
        t1, t2 = m
        if team_count[t1] < 6 and team_count[t2] < 6:
            selected.append(m)
            team_count[t1] += 1
            team_count[t2] += 1
        if len(selected) == 45:
            break

    if len(selected) != 45:
        return None

    random.shuffle(selected)

    slots = list(range(1, 14))
    assignments = {s: [] for s in slots}  # list of (t1, t2, field)
    sport_count = {t: {"volleyball": 0, "spikeball": 0} for t in teams}

    def team_slots(t):
        return sorted(s for s in slots for (a, b, _) in assignments[s] if a == t or b == t)

    def max_consecutive(slot_list):
        if not slot_list:
            return 0
        mc = cc = 1
        for i in range(1, len(slot_list)):
            if slot_list[i] == slot_list[i-1] + 1:
                cc += 1
                mc = max(mc, cc)
            else:
                cc = 1
        return mc

    def backtrack(idx):
        if idx == len(selected):
            return True

        t1, t2 = selected[idx]

        # Try slots in shuffled order for diversity
        slot_order = slots[:]
        random.shuffle(slot_order)

        for slot in slot_order:
            busy = {a for (a, b, _) in assignments[slot]} | {b for (a, b, _) in assignments[slot]}
            if t1 in busy or t2 in busy:
                continue

            fields = get_fields(slot)
            used = {f for (_, _, f) in assignments[slot]}
            avail = [f for f in fields if f not in used]
            if not avail:
                continue

            # Check consecutive constraint - reject if adding this slot creates 3+ consecutive
            for t in (t1, t2):
                sl = team_slots(t)
                sl_new = sorted(sl + [slot])
                if max_consecutive(sl_new) > 2:
                    avail = []  # skip this slot for this team pair
                    break

            if not avail:
                continue

            # Sort fields by sport balance score (prefer underrepresented sport)
            def score(f):
                sp = field_sport(f)
                s1 = sport_count[t1][sp]
                s2 = sport_count[t2][sp]
                # Penalize if either team already has MAX_SPORT_IMBALANCE of this sport
                penalty = 0
                if s1 >= MAX_SPORT_IMBALANCE or s2 >= MAX_SPORT_IMBALANCE:
                    penalty = 100
                return s1 + s2 + penalty

            avail.sort(key=score)

            for field in avail:
                sport = field_sport(field)
                # Hard block: don't give a team more than MAX_SPORT_IMBALANCE of one sport
                if sport_count[t1][sport] >= MAX_SPORT_IMBALANCE or sport_count[t2][sport] >= MAX_SPORT_IMBALANCE:
                    continue

                assignments[slot].append((t1, t2, field))
                sport_count[t1][sport] += 1
                sport_count[t2][sport] += 1

                if backtrack(idx + 1):
                    return True

                assignments[slot].pop()
                sport_count[t1][sport] -= 1
                sport_count[t2][sport] -= 1

        return False

    if backtrack(0):
        return assignments
    return None

result = None
for seed in range(500):
    result = solve(seed)
    if result:
        print(f"Solved with seed={seed}")
        break

if not result:
    print("No solution found")
    exit(1)

# Print schedule
print("\n=== GROUP STAGE SCHEDULE ===\n")
game_id = 1
all_games = []
for slot in range(1, 14):
    time = slot_times[slot]
    games = sorted(result[slot], key=lambda x: x[2])
    print(f"SLOT {slot:02d} | {time}")
    print("-" * 55)
    for (t1, t2, field) in games:
        sport = "BV" if field.startswith("BV") else "SPK"
        print(f"  Game {game_id:02d} | {field}  [{sport}] | Team {t1:02d} vs Team {t2:02d}")
        all_games.append({"id": game_id, "slot": slot, "time": time, "field": field,
                          "sport": "volleyball" if sport == "BV" else "spikeball",
                          "team1": t1, "team2": t2})
        game_id += 1
    print()

# Analysis
print("\n=== TEAM ANALYSIS ===\n")
print(f"{'Team':<6} | {'BV':>3} {'SPK':>3} | Slots played                          | Consec | MaxBreak")
print("-" * 90)

for t in teams:
    my_games = sorted([(g["slot"], g["field"]) for g in all_games if g["team1"] == t or g["team2"] == t])
    bv = sum(1 for _, f in my_games if f.startswith("BV"))
    spk = sum(1 for _, f in my_games if f.startswith("SPK"))
    sl = [s for s, _ in my_games]

    mc = cc = 1
    for i in range(1, len(sl)):
        cc = cc + 1 if sl[i] == sl[i-1] + 1 else 1
        mc = max(mc, cc)

    breaks = [sl[i] - sl[i-1] - 1 for i in range(1, len(sl))]
    max_break = max(breaks) if breaks else 0

    consec_flag = " !!!" if mc >= 3 else "    "
    break_flag = f" ({max_break*20}min break)"

    print(f"  T{t:02d}   | {bv:>3} {spk:>3} | {sl} | {mc}{consec_flag} | {max_break} slots{break_flag}")

print("\n!!! = 3 consecutive games (back-to-back-to-back)")

# Summary stats
all_consec = []
all_breaks = []
for t in teams:
    sl = sorted(g["slot"] for g in all_games if g["team1"] == t or g["team2"] == t)
    mc = cc = 1
    for i in range(1, len(sl)):
        cc = cc + 1 if sl[i] == sl[i-1] + 1 else 1
        mc = max(mc, cc)
    all_consec.append(mc)
    breaks = [sl[i] - sl[i-1] - 1 for i in range(1, len(sl))]
    if breaks:
        all_breaks.append(max(breaks))

print(f"\nMax consecutive across all teams: {max(all_consec)}")
print(f"Max break across all teams: {max(all_breaks)} slots = {max(all_breaks)*20} min")
print(f"Teams with 3 consecutive: {sum(1 for c in all_consec if c >= 3)}")
