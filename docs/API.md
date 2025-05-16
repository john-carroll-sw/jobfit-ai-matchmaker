# Ingesting the API for Event-Driven Processing

The Content Processing solution accelerator consists of a number of APIs to handle processing. The web UI utilizes these same APIs to demonstrate uploading a file to be processed, processing it, and showing the current processing queue. This also includes adding and modifying schema definitions that files are being mapped and transformed to.

> 
    Note: Once the solution has been deployed, you'll be able to access the API definition here:

    Swagger: https://<content-processing-api-container-url>/docs

    OpenAPI: https://<content-processing-api-container-url>/redoc

## APIs
Outlined below are the various APIs that are available as both Swagger and OpenAPI specifications within the solution.

### Content Processor
Responsible processing level actions to capture a file, processes, and queue management.
- **[POST]** Processed: Get all processed contents list.
- **[POST]** Submit: Submit a file to be processed with its selected schema and any custom meta data to pass along with it for external reference.
- **[GET]** Status: Get the status of a file being processed. It shows the status of the file being processed in the pipeline.
- **[GET]** Processed: Get the processed content results.
- **[PUT]** Processed: Updates the processed content results; updates the comment in the process.
- **[GET]** Processes Steps: Get the processed content result steps.
- **[GET]** Processed Files: Gets the original files to be processed. 

### Schema Vault
System level configuration for adding and managing schemas in the system related to processing.
- **[GET]** SchemaVault: Gets the list of schemas registered in the system.
-  **[PUT]** SchemaVault: Updates the schema with new information passed.
- **[POST]** SchemaVault: Creates and registers a new schema in the system.
- **[DELETE]** SchemaVault: Unregisters a schema from the system.
- **[GET]** Schema: Get registered schema file by schema ID.
- **[GET]** Health: Determines the alive state of the solution for processing.
- **[GET]** Startup: Determines the startup state of the solution.

> Note: You can find a sample REST Client call with endpoints and payload examples in the repository at:<br/><br/>
/src/ContentProcessorAPI/test_http/invoke_APIs.http

## Note on Custom Meta Data
Custom meta data can optionally be passed along when submitting a file to be processed on the Content Processor API. This allows for external source system reference information to be captured and passed through the processing steps. This information stays as reference only for down-stream reference and is not used in processing or modifying any data extraction, mapping, or transformation.

## Security
Security is applied to the API by utilizing a vnet for traffic and network control. A service principal with permission can programmatically call the end points and is registered as an application registration in Azure.
