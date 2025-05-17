// Creates Azure AI Search service for vector search capabilities
param searchName string
param location string = resourceGroup().location

@description('SKU for the search service')
@allowed(['free', 'basic', 'standard', 'standard2', 'standard3', 'storage_optimized_l1', 'storage_optimized_l2'])
param sku string = 'standard'

@description('Replica count for the search service')
param replicaCount int = 1

@description('Partition count for the search service')
param partitionCount int = 1

@description('Semantic search tier')
@allowed(['free', 'standard'])
param semanticSearchTier string = 'free'

// Azure AI Search service
resource searchService 'Microsoft.Search/searchServices@2023-11-01' = {
  name: searchName
  location: location
  properties: {
    replicaCount: replicaCount
    partitionCount: partitionCount
    semanticSearch: semanticSearchTier
  }
  sku: {
    name: sku
  }
  identity: {
    type: 'SystemAssigned'
  }
}

output searchServiceName string = searchService.name
output searchServiceEndpoint string = 'https://${searchService.name}.search.windows.net'
output searchServiceId string = searchService.id
output searchServicePrincipalId string = searchService.identity.principalId
@secure()
output searchServiceApiKey string = listAdminKeys(resourceId('Microsoft.Search/searchServices', searchName), '2023-11-01').primaryKey
