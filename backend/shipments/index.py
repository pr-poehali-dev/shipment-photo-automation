import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p33761989_shipment_photo_autom')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    """Получает список отгрузок с прикреплёнными файлами, создаёт новую отгрузку."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, client, date, items, status, amount, created_at FROM {SCHEMA}.shipments ORDER BY created_at DESC"
        )
        rows = cur.fetchall()
        shipments = []
        for row in rows:
            sid = row[0]
            cur.execute(
                f"SELECT file_type, file_url, file_name, uploaded_at FROM {SCHEMA}.shipment_files WHERE shipment_id = %s ORDER BY uploaded_at",
                (sid,),
            )
            files = [{'file_type': f[0], 'url': f[1], 'file_name': f[2]} for f in cur.fetchall()]
            shipments.append({
                'id': sid,
                'client': row[1],
                'date': row[2],
                'items': row[3],
                'status': row[4],
                'amount': row[5],
                'files': files,
            })
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps({'shipments': shipments}, ensure_ascii=False),
        }

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        sid = body.get('id')
        client = body.get('client')
        date = body.get('date')
        items = body.get('items', 0)
        status = body.get('status', 'pending')
        amount = body.get('amount', '0 ₽')

        if not all([sid, client, date]):
            return {
                'statusCode': 400,
                'headers': CORS,
                'body': json.dumps({'error': 'id, client, date обязательны'}, ensure_ascii=False),
            }

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.shipments (id, client, date, items, status, amount) VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (id) DO NOTHING RETURNING id",
            (sid, client, date, items, status, amount),
        )
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        if not result:
            return {
                'statusCode': 409,
                'headers': CORS,
                'body': json.dumps({'error': 'Отгрузка с таким ID уже существует'}, ensure_ascii=False),
            }
        return {
            'statusCode': 200,
            'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps({'id': sid, 'created': True}, ensure_ascii=False),
        }

    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}
