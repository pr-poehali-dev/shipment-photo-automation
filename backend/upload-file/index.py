import json
import os
import base64
import uuid
import boto3

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p33761989_shipment_photo_autom')


def handler(event: dict, context) -> dict:
    """Загружает фото товара или счёт в S3 и сохраняет ссылку в БД."""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    body = json.loads(event.get('body') or '{}')
    shipment_id = body.get('shipment_id')
    file_type = body.get('file_type')  # 'photo' or 'invoice'
    file_data_b64 = body.get('file_data')
    file_name = body.get('file_name', 'file')
    content_type = body.get('content_type', 'application/octet-stream')

    if not all([shipment_id, file_type, file_data_b64]):
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'required: shipment_id, file_type, file_data'}),
        }

    if file_type not in ('photo', 'invoice'):
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'file_type должен быть photo или invoice'}),
        }

    file_bytes = base64.b64decode(file_data_b64)
    ext = file_name.rsplit('.', 1)[-1] if '.' in file_name else 'bin'
    key = f"shipments/{shipment_id}/{file_type}/{uuid.uuid4()}.{ext}"

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    s3.put_object(Bucket='files', Key=key, Body=file_bytes, ContentType=content_type)
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    import psycopg2
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.shipment_files (shipment_id, file_type, file_url, file_name) VALUES (%s, %s, %s, %s) RETURNING id",
        (shipment_id, file_type, cdn_url, file_name),
    )
    file_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'id': file_id, 'url': cdn_url, 'file_name': file_name}),
    }