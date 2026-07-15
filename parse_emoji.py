import json, sys

with open(r'C:\Users\lwj\.claude\projects\d------------\2b4f3bb2-5b8b-40b9-b0aa-0b73ac611d1f\tool-results\call_00_vpgVRUuO8l7YZl38SH8b8729.json') as f:
    data = json.load(f)

t = data[0]['text']
print('len:', len(t))
idx = t.find('Emoji_Presentation')
if idx >= 0:
    start = max(0, idx - 50)
    end = min(len(t), idx + 200)
    context = t[start:end]
    print('Context:', repr(context))
else:
    print('NOT FOUND')
    idx2 = t.find('emoji style')
    if idx2 >= 0:
        print('Found emoji style at index:', idx2)
    idx3 = t.find('Emoji#')
    print('Emoji# at:', idx3 if idx3 >= 0 else 'NOT FOUND')
