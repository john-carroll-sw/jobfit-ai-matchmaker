targetScope = 'resourceGroup'

param appConfigName string 

param location string = resourceGroup().location
param skuName string = 'Standard'
param storageBlobUrl string
param storageQueueUrl string
param openAIEndpoint string
param contentUnderstandingEndpoint string
param gptModelName string
param embeddingModelName string
param keyVaultId string
param aiProjectConnectionString string
param cosmosDbName string
param searchServiceName string = ''
param searchServiceEndpoint string = ''
param searchServiceApiKey string = ''

param keyValues array = [
  {
    key: 'APP_AZURE_OPENAI_ENDPOINT'
    value: openAIEndpoint
  }
  {
    key: 'APP_AZURE_OPENAI_MODEL'
    value: gptModelName
  }
  {
    key: 'APP_AZURE_OPENAI_EMBEDDING_MODEL'
    value: embeddingModelName
  }
  {
    key: 'APP_CONTENT_UNDERSTANDING_ENDPOINT'
    value: contentUnderstandingEndpoint
  }
  {
    key: 'APP_COSMOS_CONTAINER_PROCESS'
    value: 'Processes'
  }
  {
    key: 'APP_COSMOS_CONTAINER_SCHEMA'
    value: 'Schemas'
  }
  {
    key: 'APP_COSMOS_DATABASE'
    value: 'ContentProcess'
  }
  {
    key: 'APP_CPS_CONFIGURATION'
    value: 'cps-configuration'
  }
  {
    key: 'APP_CPS_MAX_FILESIZE_MB'
    value: '20'
  }
  {
    key: 'APP_CPS_PROCESSES'
    value: 'cps-processes'
  }
  {
    key: 'APP_LOGGING_ENABLE'
    value: 'False'
  }
  {
    key: 'APP_LOGGING_LEVEL'
    value: 'INFO'
  }
  {
    key: 'APP_MESSAGE_QUEUE_EXTRACT'
    value: 'content-pipeline-extract-queue'
  }
  {
    key: 'APP_MESSAGE_QUEUE_INTERVAL'
    value: '5'
  }
  {
    key: 'APP_MESSAGE_QUEUE_PROCESS_TIMEOUT'
    value: '180'
  }
  {
    key: 'APP_MESSAGE_QUEUE_VISIBILITY_TIMEOUT'
    value: '10'
  }
  {
    key: 'APP_PROCESS_STEPS'
    value: 'extract,map,evaluate,embed,index,save'
  }
  {
    key: 'APP_STORAGE_BLOB_URL'
    value: storageBlobUrl
  }
  {
    key: 'APP_STORAGE_QUEUE_URL'
    value: storageQueueUrl
  }
  {
    key: 'APP_AI_PROJECT_CONN_STR'
    value: aiProjectConnectionString
  }
  {
    key: 'APP_SEARCH_SERVICE_NAME'
    value: searchServiceName
  }
  {
    key: 'APP_SEARCH_ENDPOINT'
    value: searchServiceEndpoint
  }
  {
    key: 'APP_SEARCH_INDEX_NAME'
    value: 'resume-vector-index'
  }
  {
    key: 'APP_AZURE_OPENAI_EMBEDDING_DEPLOYMENT'
    value: 'text-embedding-3-large'
  }
]

resource appConfig 'Microsoft.AppConfiguration/configurationStores@2023-03-01' = {
  name: appConfigName
  location: location
  identity: {
    type:'SystemAssigned'
  }
  sku: {
    name: skuName
  }
}

// Assign "Key Vault Secrets User" Role to App Configuration Identity
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(appConfig.id, keyVaultId, 'KeyVaultSecretsUser')
  scope: resourceGroup()
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7') // Key Vault Secrets User role ID
    principalId: appConfig.identity.principalId
  }
}

resource appConfigKeys 'Microsoft.AppConfiguration/configurationStores/keyValues@2024-05-01' = [
  for keyValue in keyValues: {
    name: keyValue.key
    parent: appConfig
    properties: {
      value: keyValue.value
    }
  }
]

resource cosmos 'Microsoft.DocumentDB/databaseAccounts@2024-12-01-preview' existing = {
  name: cosmosDbName
}

resource cosmoDbKey 'Microsoft.AppConfiguration/configurationStores/keyValues@2024-05-01' = {
  parent: appConfig
  name: 'APP_COSMOS_CONNSTR'
  properties: {
    value: cosmos.listConnectionStrings().connectionStrings[0].connectionString
  }
}

// Store Search API key if it's provided
resource searchApiKey 'Microsoft.AppConfiguration/configurationStores/keyValues@2024-05-01' = if (!empty(searchServiceApiKey)) {
  parent: appConfig
  name: 'APP_SEARCH_API_KEY'
  properties: {
    value: searchServiceApiKey
  }
}

output appConfigName string = appConfig.name
output appConfigId string = appConfig.id
output appConfigEndpoint string = appConfig.properties.endpoint
