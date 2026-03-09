"""
Авторизация игры 'Король парковки': регистрация, логин, сохранение, счётчик.
POST / с полем action: register | login | save | save_ya | save_anon | load_ya | load_anon | count
"""
import json
import os
import hashlib
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p25425030_parking_challenge_ga')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def ok(data: dict) -> dict:
    return {'statusCode': 200, 'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'}, 'body': json.dumps(data)}

def err(msg: str, code: int = 400) -> dict:
    return {'statusCode': code, 'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg})}

def row_to_profile(row) -> dict:
    result = {
        'id': row[0],
        'name': row[1],
        'emoji': row[2],
        'coins': row[4],
        'gems': row[5],
        'xp': row[6],
        'wins': row[7],
        'gamesPlayed': row[8],
        'bestPosition': row[9],
        'selectedCar': row[10],
        'ownedCars': [int(x) for x in row[11].split(',') if x],
        'upgrades': json.loads(row[12]) if row[12] else {},
    }
    if len(row) > 13 and row[13]:
        result['cars'] = json.loads(row[13])
    if len(row) > 14 and row[14]:
        extra = json.loads(row[14])
        result.update({
            'extraLives': extra.get('extraLives', 0),
            'coinBoostSessions': extra.get('coinBoostSessions', 0),
            'xpBoostGames': extra.get('xpBoostGames', 0),
            'loginStreak': extra.get('loginStreak', 0),
            'lastLoginDate': extra.get('lastLoginDate', ''),
            'level': extra.get('level', 1),
            'dailyQuests': extra.get('dailyQuests', []),
            'dailyQuestsDate': extra.get('dailyQuestsDate', ''),
            'weeklyQuests': extra.get('weeklyQuests', []),
            'weeklyQuestsDate': extra.get('weeklyQuestsDate', ''),
            'upgradeExpiry': extra.get('upgradeExpiry', {}),
            'nicknameChanges': extra.get('nicknameChanges', 0),
        })
    return result

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return err('Method not allowed', 405)

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return err('Invalid JSON')

    action = body.get('action', '')
    conn = get_conn()
    cur = conn.cursor()

    try:
        if action == 'register':
            name = (body.get('name') or '').strip()
            emoji = body.get('emoji', '😎')
            password = body.get('password', '')

            if len(name) < 2 or len(name) > 16:
                return err('Имя должно быть от 2 до 16 символов')
            if len(password) < 4:
                return err('Пароль минимум 4 символа')

            pw_hash = hash_password(password)

            # Проверяем уникальность ника
            cur.execute(f'SELECT id FROM {SCHEMA}.players WHERE LOWER(name) = LOWER(%s)', (name,))
            if cur.fetchone():
                return err('Этот ник уже занят. Выбери другой!')

            cur.execute(
                f'''INSERT INTO {SCHEMA}.players (name, emoji, password_hash, coins, gems, xp, wins, games_played, best_position, selected_car, owned_cars, upgrades)
                    VALUES (%s, %s, %s, 1000, 50, 0, 0, 0, 99, 0, '0', '{{}}')
                    RETURNING id, name, emoji, password_hash, coins, gems, xp, wins, games_played, best_position, selected_car, owned_cars, upgrades''',
                (name, emoji, pw_hash)
            )
            row = cur.fetchone()
            conn.commit()
            return ok({'success': True, 'profile': row_to_profile(row)})

        elif action == 'login':
            name = (body.get('name') or '').strip()
            password = body.get('password', '')

            if not name or not password:
                return err('Введи ник и пароль')

            pw_hash = hash_password(password)
            cur.execute(
                f'''SELECT id, name, emoji, password_hash, coins, gems, xp, wins, games_played, best_position, selected_car, owned_cars, upgrades
                    FROM {SCHEMA}.players WHERE LOWER(name) = LOWER(%s)''',
                (name,)
            )
            row = cur.fetchone()
            if not row:
                return err('Игрок с таким ником не найден')
            if row[3] != pw_hash:
                return err('Неверный пароль')

            return ok({'success': True, 'profile': row_to_profile(row)})

        elif action == 'save':
            name = (body.get('name') or '').strip()
            password = body.get('password', '')
            profile = body.get('profile', {})

            if not name or not password:
                return err('Нет авторизации')

            pw_hash = hash_password(password)
            cur.execute(
                f'SELECT id FROM {SCHEMA}.players WHERE LOWER(name) = LOWER(%s) AND password_hash = %s',
                (name, pw_hash)
            )
            if not cur.fetchone():
                return err('Ошибка авторизации', 401)

            owned_cars = ','.join(str(x) for x in (profile.get('ownedCars') or [0]))
            upgrades = json.dumps(profile.get('upgrades') or {})

            cur.execute(
                f'''UPDATE {SCHEMA}.players SET
                    emoji = %s, coins = %s, gems = %s, xp = %s,
                    wins = %s, games_played = %s, best_position = %s,
                    selected_car = %s, owned_cars = %s, upgrades = %s,
                    updated_at = NOW()
                    WHERE LOWER(name) = LOWER(%s)''',
                (
                    profile.get('emoji', '😎'),
                    max(0, int(profile.get('coins', 0))),
                    max(0, int(profile.get('gems', 0))),
                    max(0, int(profile.get('xp', 0))),
                    max(0, int(profile.get('wins', 0))),
                    max(0, int(profile.get('gamesPlayed', 0))),
                    int(profile.get('bestPosition', 99)),
                    int(profile.get('selectedCar', 0)),
                    owned_cars,
                    upgrades,
                    name
                )
            )
            conn.commit()
            return ok({'success': True})

        elif action == 'save_ya':
            ya_id = (body.get('yaId') or '').strip()
            profile = body.get('profile', {})

            if not ya_id:
                return err('Нет yaId')

            name = (profile.get('name') or 'Игрок').strip()[:16] or 'Игрок'
            emoji = profile.get('emoji', '😎')
            coins = max(0, int(profile.get('coins', 0)))
            gems = max(0, int(profile.get('gems', 0)))
            xp = max(0, int(profile.get('xp', 0)))
            wins = max(0, int(profile.get('wins', 0)))
            games_played = max(0, int(profile.get('gamesPlayed', 0)))
            best_position = int(profile.get('bestPosition', 99))
            selected_car = int(profile.get('selectedCar', 0))
            owned_cars = ','.join(str(x) for x in (profile.get('ownedCars') or [0]))
            upgrades = json.dumps(profile.get('upgrades') or {})
            cars_json = json.dumps(profile.get('cars') or []) if profile.get('cars') else None
            extra_data = json.dumps({
                'extraLives': profile.get('extraLives', 0),
                'coinBoostSessions': profile.get('coinBoostSessions', 0),
                'xpBoostGames': profile.get('xpBoostGames', 0),
                'loginStreak': profile.get('loginStreak', 0),
                'lastLoginDate': profile.get('lastLoginDate', ''),
                'level': profile.get('level', 1),
                'dailyQuests': profile.get('dailyQuests', []),
                'dailyQuestsDate': profile.get('dailyQuestsDate', ''),
                'weeklyQuests': profile.get('weeklyQuests', []),
                'weeklyQuestsDate': profile.get('weeklyQuestsDate', ''),
                'upgradeExpiry': profile.get('upgradeExpiry', {}),
                'nicknameChanges': profile.get('nicknameChanges', 0),
            })

            cur.execute(
                f'''INSERT INTO {SCHEMA}.players (name, emoji, password_hash, coins, gems, xp, wins, games_played, best_position, selected_car, owned_cars, upgrades, ya_id, cars_json, extra_data)
                    VALUES (%s, %s, '', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (ya_id) DO UPDATE SET
                        name = EXCLUDED.name, emoji = EXCLUDED.emoji,
                        coins = EXCLUDED.coins, gems = EXCLUDED.gems, xp = EXCLUDED.xp,
                        wins = EXCLUDED.wins, games_played = EXCLUDED.games_played,
                        best_position = EXCLUDED.best_position, selected_car = EXCLUDED.selected_car,
                        owned_cars = EXCLUDED.owned_cars, upgrades = EXCLUDED.upgrades,
                        cars_json = COALESCE(EXCLUDED.cars_json, {SCHEMA}.players.cars_json),
                        extra_data = EXCLUDED.extra_data,
                        updated_at = NOW()''',
                (name, emoji, coins, gems, xp, wins, games_played, best_position, selected_car, owned_cars, upgrades, ya_id, cars_json, extra_data)
            )
            conn.commit()
            return ok({'success': True})

        elif action == 'save_anon':
            anon_id = (body.get('playerId') or '').strip()
            profile = body.get('profile', {})

            if not anon_id:
                return err('Нет playerId')

            name = (profile.get('name') or 'Игрок').strip()[:16] or 'Игрок'
            emoji = profile.get('emoji', '😎')
            coins = max(0, int(profile.get('coins', 0)))
            gems = max(0, int(profile.get('gems', 0)))
            xp = max(0, int(profile.get('xp', 0)))
            wins = max(0, int(profile.get('wins', 0)))
            games_played = max(0, int(profile.get('gamesPlayed', 0)))
            best_position = int(profile.get('bestPosition', 99))
            selected_car = int(profile.get('selectedCar', 0))
            owned_cars = ','.join(str(x) for x in (profile.get('ownedCars') or [0]))
            upgrades = json.dumps(profile.get('upgrades') or {})
            cars_json = json.dumps(profile.get('cars') or []) if profile.get('cars') else None
            extra_data = json.dumps({
                'extraLives': profile.get('extraLives', 0),
                'coinBoostSessions': profile.get('coinBoostSessions', 0),
                'xpBoostGames': profile.get('xpBoostGames', 0),
                'loginStreak': profile.get('loginStreak', 0),
                'lastLoginDate': profile.get('lastLoginDate', ''),
                'level': profile.get('level', 1),
                'dailyQuests': profile.get('dailyQuests', []),
                'dailyQuestsDate': profile.get('dailyQuestsDate', ''),
                'weeklyQuests': profile.get('weeklyQuests', []),
                'weeklyQuestsDate': profile.get('weeklyQuestsDate', ''),
                'upgradeExpiry': profile.get('upgradeExpiry', {}),
                'nicknameChanges': profile.get('nicknameChanges', 0),
            })

            cur.execute(
                f'''INSERT INTO {SCHEMA}.players (name, emoji, password_hash, coins, gems, xp, wins, games_played, best_position, selected_car, owned_cars, upgrades, anon_id, cars_json, extra_data)
                    VALUES (%s, %s, '', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (anon_id) DO UPDATE SET
                        name = EXCLUDED.name, emoji = EXCLUDED.emoji,
                        coins = EXCLUDED.coins, gems = EXCLUDED.gems, xp = EXCLUDED.xp,
                        wins = EXCLUDED.wins, games_played = EXCLUDED.games_played,
                        best_position = EXCLUDED.best_position, selected_car = EXCLUDED.selected_car,
                        owned_cars = EXCLUDED.owned_cars, upgrades = EXCLUDED.upgrades,
                        cars_json = COALESCE(EXCLUDED.cars_json, {SCHEMA}.players.cars_json),
                        extra_data = EXCLUDED.extra_data,
                        updated_at = NOW()''',
                (name, emoji, coins, gems, xp, wins, games_played, best_position, selected_car, owned_cars, upgrades, anon_id, cars_json, extra_data)
            )
            conn.commit()
            return ok({'success': True})

        elif action == 'load_ya':
            ya_id = (body.get('yaId') or '').strip()
            if not ya_id:
                return err('Нет yaId')
            cur.execute(
                f'''SELECT id, name, emoji, password_hash, coins, gems, xp, wins, games_played, best_position, selected_car, owned_cars, upgrades, cars_json, extra_data
                    FROM {SCHEMA}.players WHERE ya_id = %s LIMIT 1''',
                (ya_id,)
            )
            row = cur.fetchone()
            if not row:
                return ok({'profile': None})
            return ok({'profile': row_to_profile(row)})

        elif action == 'load_anon':
            anon_id = (body.get('playerId') or '').strip()
            if not anon_id:
                return err('Нет playerId')
            cur.execute(
                f'''SELECT id, name, emoji, password_hash, coins, gems, xp, wins, games_played, best_position, selected_car, owned_cars, upgrades, cars_json, extra_data
                    FROM {SCHEMA}.players WHERE anon_id = %s LIMIT 1''',
                (anon_id,)
            )
            row = cur.fetchone()
            if not row:
                return ok({'profile': None})
            return ok({'profile': row_to_profile(row)})

        elif action == 'count':
            cur.execute(f'SELECT COUNT(*) FROM {SCHEMA}.players')
            count = cur.fetchone()[0]
            return ok({'count': count})

        else:
            return err('Unknown action')

    except Exception as e:
        conn.rollback()
        return err(f'Server error: {str(e)}', 500)
    finally:
        cur.close()
        conn.close()