param solutionName string
param containerEnvName string
param location string

param logAnalyticsWorkspaceName string

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' existing = {
  name: logAnalyticsWorkspaceName
}

resource containerRegistryReader 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${solutionName }-acr-managed-identity'
  location: location
  tags: {
    app: solutionName
    location: location
  }
}

// resource acrPullRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
//   name: guid(azureContainerRegistry, containerRegistryReader.id, 'acrpull')
//   scope: resourceGroup()
//   properties: {
//     roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d') // AcrPull role
//     principalId: containerRegistryReader.properties.principalId
//   }
// }

resource containerAppEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: containerEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
    zoneRedundant: false
    workloadProfiles: [
      {
        workloadProfileType: 'Consumption'
        name: 'Consumption'
      }
    ]
    vnetConfiguration: null
  }
}

output containerEnvId string = containerAppEnv.id
output containerRegistryReaderId string = containerRegistryReader.id
output containerRegistryReaderPrincipalId string = containerRegistryReader.properties.principalId
