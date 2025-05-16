## [Optional]: Customizing resource names 

By default this template will use the environment name as the prefix to prevent naming collisions within Azure. The parameters below show the default values. You only need to run the statements below if you need to change the values. 


> To override any of the parameters, run `azd env set <key> <value>` before running `azd up`. On the first azd command, it will prompt you for the environment name. Be sure to choose 3-20 charaters alphanumeric unique name. 


Set the Environment Name Prefix
```shell
azd env set AZURE_ENV_NAME 'cps'
```

Change the Azure Content Understanding Service Location (example: eastus2, westus2, etc.)
```shell
azd env set AZURE_ENV_CU_LOCATION 'West US'
```

Change the Deployment Type (allowed values: Standard, GlobalStandard)
```shell
azd env set AZURE_ENV_MODEL_DEPLOYMENT_TYPE 'GlobalStandard'
```

Set the Model Name (allowed values: gpt-4o)
```shell
azd env set AZURE_ENV_MODEL_NAME 'gpt-4o'
```

Change the Model Capacity (choose a number based on available GPT model capacity in your subscription)
```shell
azd env set AZURE_ENV_MODEL_CAPACITY '30'
```

Change if the deployment should use a local build of the containers
```shell
azd env set USE_LOCAL_BUILD 'false'
```