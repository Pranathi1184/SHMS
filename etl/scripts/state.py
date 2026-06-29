import json


def load_state(state_file):
    if not state_file.exists():
        return {'watermarks': {}}
    with state_file.open('r', encoding='utf-8') as file_obj:
        return json.load(file_obj)


def save_state(state_file, state):
    with state_file.open('w', encoding='utf-8') as file_obj:
        json.dump(state, file_obj, indent=2)
