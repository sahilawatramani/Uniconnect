import urllib.request, json

try:
    req = urllib.request.Request(
        'http://127.0.0.1:8000/ai/ask',
        data=json.dumps({'question': 'what is it about?'}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    resp = urllib.request.urlopen(req, timeout=300)
    print("SUCCESS:")
    print(resp.read().decode())
except Exception as e:
    if hasattr(e, 'read'):
        print("ERROR RESPONSE:")
        print(e.read().decode())
    else:
        print("ERROR:", type(e).__name__, str(e))
