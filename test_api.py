import urllib.request, json
try:
    req = urllib.request.Request('http://127.0.0.1:8000/ai/query', data=json.dumps({'question':'Students with attendance below 75%'}).encode(), headers={'Content-Type': 'application/json'})
    resp = urllib.request.urlopen(req)
    print(resp.read().decode())
except Exception as e:
    print(e.read().decode())
