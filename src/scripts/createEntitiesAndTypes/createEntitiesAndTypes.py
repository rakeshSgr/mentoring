import os
import csv
import requests
import sys

DEFAULT_MENTORING_DOMAIN = 'http://localhost:3569'
MENTORING_DOMAIN = DEFAULT_MENTORING_DOMAIN

access_token = ''
entity_type_id = ''

def main():
    try:
        prompt_for_domain()
        prompt_for_access_token()

        while True:
            chosen_file = select_csv_file()
            if not chosen_file:
                break

            model_names = prompt_for_model_names()
            entity_type_data = build_entity_type_data(chosen_file, model_names)
            create_entity_type(entity_type_data)

            process_csv_file(chosen_file)

            print('\n----------------------------------------\n')
            print('Choose another CSV file or type "exit" to quit.')
            print('\n----------------------------------------\n')
    except Exception as e:
        print(f"Error occurred: {e}")
    finally:
        sys.stdin.close()

def prompt_for_domain():
    global MENTORING_DOMAIN
    domain = input(f"Enter domain (default: {DEFAULT_MENTORING_DOMAIN}): ")
    if domain:
        MENTORING_DOMAIN = domain
    print(f"Using domain: {MENTORING_DOMAIN}")

def prompt_for_access_token():
    global access_token
    access_token = input("Enter access token: ")

def select_csv_file():
    try:
        files = [f for f in os.listdir('.') if f.endswith('.csv')]
        if not files:
            print("No CSV files found.")
            return None

        print("CSV files available:")
        for index, file in enumerate(files):
            print(f"{index + 1}. {file}")
        print("0. Exit")

        choice = input("Choose a CSV file (enter number or 'exit'): ").strip()
        if choice.lower() == 'exit' or choice == '0':
            return None

        file_index = int(choice) - 1
        if 0 <= file_index < len(files):
            chosen_file = files[file_index]
            print(f"Chosen CSV file: {chosen_file}")
            return chosen_file
        else:
            raise ValueError("Invalid choice.")
    except Exception as e:
        print(f"Error: {e}")
        return None

def prompt_for_model_names():
    while True:
        answer = input("Enter model names (space separated): ")
        model_names = answer.split()
        if model_names:
            print(f"Chosen model names: {model_names}")
            return model_names
        else:
            print("No model names provided. Try again.")

def create_entity_type(entity_type_data):
    global entity_type_id
    try:
        response = requests.post(
            f"{MENTORING_DOMAIN}/mentoring/v1/entity-type/create",
            json=entity_type_data,
            headers={
                'x-auth-token': f"bearer {access_token}",
                'Content-Type': 'application/json'
            }
        )
        response.raise_for_status()
        entity_type_id = response.json()['result']['id']
        print(f"Entity type created successfully. Entity type ID: {entity_type_id}")
    except requests.RequestException as e:
        print(f"Entity type creation failed: {e}")
        raise

def process_csv_file(chosen_file):
    try:
        with open(chosen_file, 'r', newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                identifier = row['identifier']
                entity = row['entity']
                create_entity(identifier, entity)
        print("All entities created successfully.")
    except Exception as e:
        print(f"Error processing CSV file: {e}")

def create_entity(identifier, entity, retries=3):
    try:
        response = requests.post(
            f"{MENTORING_DOMAIN}/mentoring/v1/entity/create",
            json={
                'value': identifier.strip(),
                'label': entity.strip(),
                'status': 'ACTIVE',
                'type': 'SYSTEM',
                'entity_type_id': entity_type_id
            },
            headers={
                'x-auth-token': f"bearer {access_token}",
                'Content-Type': 'application/json'
            }
        )
        response.raise_for_status()
        print(f"Entity created successfully: {identifier} - {entity}")
    except requests.RequestException as e:
        if retries > 0:
            print(f"Failed to create entity ({identifier} - {entity}). Retrying... ({retries} retries left)")
            create_entity(identifier, entity, retries - 1)
        else:
            print(f"Max retries reached for ({identifier} - {entity}). Skipping.")

def build_entity_type_data(chosen_file, model_names):
    value = chosen_file.replace('.csv', '').lower()
    label = ' '.join(word.capitalize() for word in value.split('_'))
    return {
        'value': value,
        'label': label,
        'status': 'ACTIVE',
        'allow_filtering': False,
        'data_type': 'STRING',
        'allow_custom_entities': True,
        'model_names': model_names,
    }

if __name__ == '__main__':
    main()
