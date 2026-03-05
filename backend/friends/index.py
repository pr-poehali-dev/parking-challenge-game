"""
Система друзей для 'Король парковки'.
POST / action: lookup | add | list | remove
- lookup: найти игрока по friend_code
- add: добавить друга (взаимно)
- list: список друзей игрока
- remove: удалить друга
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p25425030_parking_challenge_ga')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def ok(data):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg})}

def resolve_player_id(cur, body):
    """Возвращает id игрока по ya_id или anon_id из тела запроса."""
    ya_id = body.get('yaId', '')
    anon_id = body.get('playerId', '')
    if ya_id:
        cur.execute(f'SELECT id FROM {SCHEMA}.players WHERE ya_id = %s LIMIT 1', (ya_id,))
    elif anon_id:
        cur.execute(f'SELECT id FROM {SCHEMA}.players WHERE anon_id = %s LIMIT 1', (anon_id,))
    else:
        return None
    row = cur.fetchone()
    return row[0] if row else None

def ensure_friend_code(cur, conn, player_id):
    """Если у игрока нет friend_code — генерируем."""
    cur.execute(f'SELECT friend_code FROM {SCHEMA}.players WHERE id = %s', (player_id,))
    row = cur.fetchone()
    if row and row[0]:
        return row[0]
    # Генерируем новый уникальный код
    import hashlib
    base = hashlib.md5(str(player_id).encode()).hexdigest()[:8].upper()
    code = base[:6]
    cur.execute(f'UPDATE {SCHEMA}.players SET friend_code = %s WHERE id = %s', (code, player_id))
    conn.commit()
    return code

def handler(event: dict, context) -> dict:
    """Управление системой друзей."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return err('Invalid JSON')

    action = body.get('action', '')
    conn = get_conn()
    cur = conn.cursor()

    try:
        if action == 'lookup':
            # Найти игрока по коду — чтобы убедиться что код существует
            code = (body.get('code') or '').strip().upper()
            if len(code) < 6:
                return err('Код слишком короткий')
            cur.execute(
                f'SELECT id, name, emoji, friend_code FROM {SCHEMA}.players WHERE UPPER(friend_code) = %s LIMIT 1',
                (code,)
            )
            row = cur.fetchone()
            if not row:
                return err('Игрок с таким кодом не найден')
            return ok({'found': True, 'id': row[0], 'name': row[1], 'emoji': row[2], 'code': row[3]})

        elif action == 'add':
            my_id = resolve_player_id(cur, body)
            if not my_id:
                return err('Игрок не найден')

            friend_code = (body.get('code') or '').strip().upper()
            if len(friend_code) < 6:
                return err('Неверный код друга')

            # Найти друга
            cur.execute(
                f'SELECT id, name, emoji FROM {SCHEMA}.players WHERE UPPER(friend_code) = %s LIMIT 1',
                (friend_code,)
            )
            friend_row = cur.fetchone()
            if not friend_row:
                return err('Игрок с таким кодом не найден')

            friend_id = friend_row[0]
            if friend_id == my_id:
                return err('Нельзя добавить себя')

            # Проверяем — уже друзья?
            cur.execute(
                f'SELECT id FROM {SCHEMA}.friends WHERE (player_id = %s AND friend_id = %s)',
                (my_id, friend_id)
            )
            if cur.fetchone():
                return err('Этот игрок уже в друзьях')

            # Добавляем взаимную дружбу
            cur.execute(
                f'INSERT INTO {SCHEMA}.friends (player_id, friend_id, status) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING',
                (my_id, friend_id, 'accepted')
            )
            cur.execute(
                f'INSERT INTO {SCHEMA}.friends (player_id, friend_id, status) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING',
                (friend_id, my_id, 'accepted')
            )
            conn.commit()
            return ok({'success': True, 'friend': {'name': friend_row[1], 'emoji': friend_row[2], 'code': friend_code}})

        elif action == 'list':
            my_id = resolve_player_id(cur, body)
            if not my_id:
                return ok({'friends': [], 'myCode': None})

            my_code = ensure_friend_code(cur, conn, my_id)

            cur.execute(
                f'''SELECT p.id, p.name, p.emoji, p.friend_code, p.xp, p.wins,
                           f.games_together
                    FROM {SCHEMA}.friends f
                    JOIN {SCHEMA}.players p ON p.id = f.friend_id
                    WHERE f.player_id = %s
                    ORDER BY f.created_at DESC''',
                (my_id,)
            )
            rows = cur.fetchall()
            friends = [
                {'id': r[0], 'name': r[1], 'emoji': r[2], 'code': r[3], 'xp': r[4], 'wins': r[5], 'gamesTogether': r[6]}
                for r in rows
            ]
            return ok({'friends': friends, 'myCode': my_code})

        elif action == 'remove':
            my_id = resolve_player_id(cur, body)
            if not my_id:
                return err('Игрок не найден')
            friend_code = (body.get('code') or '').strip().upper()
            cur.execute(
                f'SELECT id FROM {SCHEMA}.players WHERE UPPER(friend_code) = %s LIMIT 1', (friend_code,)
            )
            row = cur.fetchone()
            if not row:
                return err('Друг не найден')
            friend_id = row[0]
            cur.execute(
                f'DELETE FROM {SCHEMA}.friends WHERE (player_id = %s AND friend_id = %s) OR (player_id = %s AND friend_id = %s)',
                (my_id, friend_id, friend_id, my_id)
            )
            conn.commit()
            return ok({'success': True})

        elif action == 'my_code':
            my_id = resolve_player_id(cur, body)
            if not my_id:
                return err('Игрок не найден')
            code = ensure_friend_code(cur, conn, my_id)
            return ok({'code': code})

        else:
            return err('Неизвестный action')

    finally:
        cur.close()
        conn.close()
