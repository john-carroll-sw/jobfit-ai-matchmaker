# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

from libs.application.application_context import AppContext
from libs.azure_helper.content_understanding import AzureContentUnderstandingHelper
from libs.azure_helper.model.content_understanding import AnalyzedResult
from libs.pipeline.entities.pipeline_file import PipelineLogEntry
from libs.pipeline.entities.pipeline_message_context import MessageContext
from libs.pipeline.entities.pipeline_step_result import StepResult
from libs.pipeline.queue_handler_base import HandlerBase

from libs.pipeline.entities.pipeline_file import ArtifactType


class ExtractHandler(HandlerBase):
    def __init__(self, appContext: AppContext, step_name: str, **data):
        super().__init__(appContext, step_name, **data)

    async def execute(self, context: MessageContext) -> StepResult:
        print(context.data_pipeline.get_previous_step_result(self.handler_name))

        # Get File then pass it to Content Understanding Service
        content_understanding_helper = AzureContentUnderstandingHelper(
            self.application_context.configuration.app_content_understanding_endpoint
        )

        response = content_understanding_helper.begin_analyze_stream(
            analyzer_id="prebuilt-layout",
            file_stream=context.data_pipeline.get_source_files()[0].download_stream(
                self.application_context.configuration.app_storage_blob_url,
                self.application_context.configuration.app_cps_processes,
            ),
        )

        response = content_understanding_helper.poll_result(response)
        result: AnalyzedResult = AnalyzedResult(**response)

        # Save Result as a file
        # Create File Entity to add
        result_file = context.data_pipeline.add_file(
            file_name="content_understanding_output.json",
            artifact_type=ArtifactType.ExtractedContent,
        )

        # log for file uploading
        result_file.log_entries.append(
            PipelineLogEntry(
                **{
                    "source": self.handler_name,
                    "message": "Content Understanding Extraction Result has been added",
                }
            )
        )

        # Upload the result to blob storage
        result_file.upload_json_text(
            account_url=self.application_context.configuration.app_storage_blob_url,
            container_name=self.application_context.configuration.app_cps_processes,
            text=result.model_dump_json(),
        )

        return StepResult(
            process_id=context.data_pipeline.pipeline_status.process_id,
            step_name=self.handler_name,
            result={
                "result": "success",
                "file_name": result_file.name,
            },
        )
