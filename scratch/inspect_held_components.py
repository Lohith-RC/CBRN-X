import re

with open('Assets/Scenes/StorageBay03_Training.unity', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

def get_block(type_id, comp_id):
    pattern = rf'--- !u!{type_id} &{comp_id}\n(.*?)(?=\n--- !u!\d+ &\d+|\Z)'
    m = re.search(pattern, text, re.DOTALL)
    return m.group(1) if m else ""

for go_id in ["1337632003", "325103837", "1268311210", "681228827"]:
    print(f"=== GO {go_id} ===")
    print(get_block("1", go_id))
