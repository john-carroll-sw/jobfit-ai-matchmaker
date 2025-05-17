using './main.bicep'

param environmentName = 'cps' // Ensure this value is <= 20 characters
param contentUnderstandingLocation = readEnvironmentVariable('AZURE_ENV_CU_LOCATION', 'WestUS')
param deploymentType = readEnvironmentVariable('AZURE_ENV_MODEL_DEPLOYMENT_TYPE', 'GlobalStandard')
param gptModelName = readEnvironmentVariable('AZURE_ENV_MODEL_NAME', 'gpt-4o')
param gptDeploymentCapacity = int(readEnvironmentVariable('AZURE_ENV_MODEL_CAPACITY', '30'))
param embeddingModelName = readEnvironmentVariable('AZURE_ENV_EMBEDDING_MODEL_NAME', 'text-embedding-3-large')
param embeddingModelCapacity = int(readEnvironmentVariable('AZURE_ENV_EMBEDDING_MODEL_CAPACITY', '300'))
param useLocalBuild = readEnvironmentVariable('USE_LOCAL_BUILD', 'false')
