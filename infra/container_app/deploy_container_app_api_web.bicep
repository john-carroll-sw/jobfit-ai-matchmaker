param solutionName string
param location string
param containerAppEnvId string
param appConfigEndPoint string = ''
param containerAppApiEndpoint string = ''
param containerAppWebEndpoint string = ''
@description('Minimum number of replicas to be added for Container App')
param minReplicaContainerApp int = 1

@description('Maximum number of replicas to be added for Container App')
param maxReplicaContainerApp int = 1

@description('Minimum number of replicas to be added for Container Api')
param minReplicaContainerApi int = 1

@description('Maximum number of replicas to be added for Container Api')
param maxReplicaContainerApi int = 1

@description('Minimum number of replicas to be added for Container Web App')
param minReplicaContainerWeb int = 1

@description('Maximum number of replicas to be added for Container Web App')
param maxReplicaContainerWeb int = 1

// Container related params
param azureContainerRegistry string
param containerRegistryReaderId string
param useLocalBuild string = 'false'

var abbrs = loadJsonContent('../abbreviations.json')

var probes = [
  // Liveness Probe - Checks if the app is still running
  {
    type: 'Liveness'
    httpGet: {
      path: '/startup'  // Your app must expose this endpoint
      port: 80
      scheme: 'HTTP'
    }
    initialDelaySeconds: 5
    periodSeconds: 10
    failureThreshold: 3
  }
  // Readiness Probe - Checks if the app is ready to receive traffic
  {
    type: 'Readiness'
    httpGet: {
      path: '/startup'
      port: 80
      scheme: 'HTTP'
    }
    initialDelaySeconds: 5
    periodSeconds: 10
    failureThreshold: 3
  }
  {
    type: 'Startup'
    httpGet: {
      path: '/startup'
      port: 80
      scheme: 'HTTP'
    }
    initialDelaySeconds: 20  // Wait 10s before checking
    periodSeconds: 5        // Check every 15s
    failureThreshold: 30       // Restart if it fails 5 times
  }
]


module containerApp 'deploy_container_app.bicep' = {
  name: 'deploy_container_app'
  params: {
    location: location
    containerAppName: '${abbrs.containers.containerApp}${solutionName}-app'
    containerEnvId: containerAppEnvId
    azureContainerRegistry: azureContainerRegistry
    azureContainerRegistryImage: 'contentprocessor'
    azureContainerRegistryImageTag: 'latest'
    managedIdentityId: containerRegistryReaderId
    containerEnvVars: [
      {
        name: 'APP_CONFIG_ENDPOINT'
        value: appConfigEndPoint
      }
    ]
    enableIngress: false
    minReplicas: minReplicaContainerApp
    maxReplicas: maxReplicaContainerApp
    useLocalBuild: useLocalBuild
  }
}

module containerAppApi 'deploy_container_app.bicep' = {
  name: 'deploy_container_app_api'
  params: {
    location: location
    containerAppName: '${abbrs.containers.containerApp}${solutionName}-api'
    containerEnvId: containerAppEnvId
    azureContainerRegistry: azureContainerRegistry
    azureContainerRegistryImage: 'contentprocessorapi'
    azureContainerRegistryImageTag: 'latest'
    allowedOrigins: [containerAppWebEndpoint]
    containerEnvVars: [
      {
        name: 'APP_CONFIG_ENDPOINT'
        value: appConfigEndPoint
      }
    ]
    probes: probes
    managedIdentityId: '' // Use system-assigned managed identity for API app
    minReplicas: minReplicaContainerApi
    maxReplicas: maxReplicaContainerApi
    useLocalBuild: useLocalBuild
  }
}

module containerAppWeb 'deploy_container_app.bicep' = {
  name: 'deploy_container_app_web'
  params: {
    location: location
    containerAppName: '${abbrs.containers.containerApp}${solutionName}-web'
    containerEnvId: containerAppEnvId
    azureContainerRegistry: azureContainerRegistry
    azureContainerRegistryImage: 'contentprocessorweb'
    azureContainerRegistryImageTag: 'latest'
    managedIdentityId: containerRegistryReaderId
    containerEnvVars: [
      {
        name: 'APP_API_BASE_URL'
        value: containerAppApi.outputs.containerEndPoint
      }
      {
        name: 'APP_WEB_CLIENT_ID'
        value: 'e53a2f17-5a67-44d8-8103-500e4f88630b'
      }
      {
        name: 'APP_WEB_AUTHORITY'
        value: '${environment().authentication.loginEndpoint}/${tenant().tenantId}'
      }
      {
        name: 'APP_WEB_SCOPE'
        value: 'api://e53a2f17-5a67-44d8-8103-500e4f88630b/user_impersonation'
      }
      {
        name: 'APP_API_SCOPE'
        value: 'api://b010e15a-df8a-4d07-9b66-28f73e581547/user_impersonation'
      }
      {
        name: 'APP_CONSOLE_LOG_ENABLED'
        value: 'true'
      }
    ]
    minReplicas: minReplicaContainerWeb
    maxReplicas: maxReplicaContainerWeb
    useLocalBuild: useLocalBuild
  }
}

output containerAppPrincipalId string =  containerApp.outputs.principalId
output containerAppApiPrincipalId string =  containerAppApi.outputs.principalId
output containerAppWebPrincipalId string =  containerAppWeb.outputs.principalId
output containerAppName string = containerApp.outputs.containerName
output containerAppApiName string = containerAppApi.outputs.containerName
output containerAppWebName string = containerAppWeb.outputs.containerName
output containweAppWebEndPoint string = containerAppWeb.outputs.containerEndPoint
output containweAppApiEndPoint string = containerAppApi.outputs.containerEndPoint
