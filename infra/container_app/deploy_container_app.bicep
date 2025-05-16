param location string

param containerAppName string

param containerEnvId string

// Managed identity with ACR pull role
param managedIdentityId string = ''

param azureContainerRegistry string
param azureContainerRegistryImage string
param azureContainerRegistryImageTag string
param containerEnvVars array = []
param enableIngress bool = true
param probes array = []
param allowedOrigins array = [] 
param minReplicas int = 1
param maxReplicas int = 1
param useLocalBuild string = 'false'

//Todo: Add Appconfig endpoint as Env variable

resource processorContainerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  identity: empty(managedIdentityId) ? {
    type: 'SystemAssigned'
  } : {
    type: 'SystemAssigned, UserAssigned'
    userAssignedIdentities: {
      '${managedIdentityId}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerEnvId
    environmentId: containerEnvId
    workloadProfileName: 'Consumption'
    configuration:{
      registries: useLocalBuild == 'true' ? [
        {
          server: azureContainerRegistry
          identity: managedIdentityId 
        }
      ] : null
      ingress: enableIngress ? {
        external: true
        transport: 'auto'
        allowInsecure: true
        corsPolicy: length(allowedOrigins) > 0 ? {
          allowedOrigins: allowedOrigins
          allowedMethods: [ 'GET', 'POST', 'PUT', 'DELETE', 'OPTIONS' ]
          allowedHeaders: [ 'Authorization', 'Content-Type', '*' ]
        } : null
      } : null
    }
    template: {
      containers: [
        {
          image: '${azureContainerRegistry}/${azureContainerRegistryImage}:${azureContainerRegistryImageTag}'
          name: containerAppName
          env: containerEnvVars
          probes: probes
          resources: {
            cpu: 4
            memory: '8Gi'
          }
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
      }
    }
  }
}

output containerName string = processorContainerApp.name
output processorContainerAppId string = processorContainerApp.id
output principalId string = processorContainerApp.identity.principalId
output containerEndPoint string = enableIngress ? 'https://${processorContainerApp.properties.configuration.ingress.fqdn}' : ''
