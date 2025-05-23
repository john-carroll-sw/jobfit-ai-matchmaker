import os
import pymongo
import certifi
from dotenv import load_dotenv
from urllib.parse import quote_plus
import json

# Load environment variables
load_dotenv()

# MongoDB connection parameters
username = quote_plus(os.getenv('AZURE_COSMOS_USERNAME'))
password = quote_plus(os.getenv('AZURE_COSMOS_PASSWORD'))
host = os.getenv('AZURE_COSMOS_HOST')
port = os.getenv('AZURE_COSMOS_PORT')
ssl_enabled = True  # Always use SSL for Cosmos DB MongoDB API

database_name = os.getenv("AZURE_COSMOS_DB", "ContentProcess")
container_name = os.getenv("AZURE_COSMOS_CONTAINER", "Processes")

# Create MongoDB connection string with SSL settings
connection_string = f"mongodb://{username}:{password}@{host}:{port}/?ssl={str(ssl_enabled).lower()}&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000"

# Connect to MongoDB with SSL certificate verification
mongo_client = pymongo.MongoClient(connection_string, tlsCAFile=certifi.where())
database = mongo_client[database_name]
collection = database[container_name]

def query_all_resumes():
    """Query all documents with target_schema.ClassName = 'Resume' using MongoDB API"""
    cursor = collection.find({"target_schema.ClassName": "Resume"})
    return list(cursor)

def debug_collection():
    print("\nCollections in database:", database.list_collection_names())
    doc = collection.find_one()
    print("Sample document:", doc)
    print("\nAll documents in collection:")
    for d in collection.find({}):
        print(d)
    print("\n--- End of all documents ---\n")

def main():
    print("Connecting to Cosmos DB MongoDB API with SSL enabled...")
    try:
        # Test the connection
        database_list = mongo_client.list_database_names()
        print(f"Connected successfully. Available databases: {database_list}")

        # debug_collection()  # Debugging: show collections and sample docs

        print("\nAll resumes:")
        resumes = query_all_resumes()
        if resumes:
            os.makedirs('resumes', exist_ok=True)
            for r in resumes:
                full_name = r.get('result', {}).get('full_name', '')
                print(f"MongoDB _id: {r.get('_id')}, Full Name: {full_name}")
                skills = (r.get('result', {}).get('skills', []))
                skill_names = []
                for s in skills:
                    name = s.get('name', '')
                    if isinstance(name, dict):
                        name = name.get('value', '')
                    skill_names.append(name)
                print(f"Skills: {', '.join(skill_names)}")
                print("-" * 50)
                # Save the 'result' field to a file
                result = r.get('result', {})
                file_id = str(r.get('_id'))
                file_path = os.path.join('resumes', f'{file_id}.json')
                with open(file_path, 'w') as f:
                    json.dump(result, f, indent=2)
        else:
            print("No resumes found.")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    main()