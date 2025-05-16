# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

from typing import Any, Dict

import certifi
from pymongo import MongoClient
from pymongo.database import Collection, Database


class CosmosMongDBHelper:
    def __init__(
        self,
        connection_string: str,
        db_name: str,
        container_name: str,
        indexes: list = None,
    ):
        self.connection_string = connection_string
        self.client: MongoClient = None
        self.container: Collection = None
        self.db: Database = None

        self.client, self.db, self.container = self._prepare(
            connection_string, db_name, container_name
        )

    def _prepare(
        self,
        connection_string: str,
        db_name: str,
        container_name: str,
        indexes: list = None,
    ):
        """
        Prepare the MongoDB connection and create the container if it doesn't exist.

        Args:
            connection_string (str): Connection String for MongoDB
            db_name (str): Database Name
            container_name (str): Collection Name to be created or used
            indexes (list, optional): Adding Fields to be get indexed for searching and ordering. Defaults to None.

        Returns:
            tuple: MongoClient, Database, Collection
        """
        # MongoClient need to get Certificate but in Container,
        # it doesn't have native certificate so we need to add it othwerwise the connection will be fail
        mongoClient = MongoClient(connection_string, tlsCAFile=certifi.where())
        database = mongoClient[db_name]
        container = self._create_container(database, container_name)
        # Add Indexes
        if indexes:
            self._create_indexes(container, indexes)
        # self._create_indexes(container, ["ClassName", "Id"])

        return mongoClient, database, container

    def _create_container(self, database: Database, container_name: str) -> Collection:
        if container_name not in database.list_collection_names():
            database.create_collection(container_name)
        return database[container_name]

    def _create_indexes(self, container, fields):
        existing_indexes = container.index_information()
        for field in fields:
            if f"{field}_1" not in existing_indexes:
                container.create_index([(field, 1)])

    def insert_document(self, document: Dict[str, Any]):
        result = self.container.insert_one(document)
        return result

    def find_document(self, query: Dict[str, Any], sort_fields=None):
        if sort_fields:
            items = list(self.container.find(query).sort(sort_fields))
        else:
            items = list(self.container.find(query))
        return items

    def update_document(self, filter: Dict[str, Any], update: Dict[str, Any]):
        result = self.container.update_one(filter, {"$set": update})
        return result

    def delete_document(self, item_id: str):
        result = self.container.delete_one({"Id": item_id})
        return result
