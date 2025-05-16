# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

import base64
import io
import json

from pdf2image import convert_from_bytes
from semantic_kernel.contents import (
    AuthorRole,
    ChatHistory,
    ChatMessageContent,
    ImageContent,
    TextContent,
)
from semantic_kernel.functions import KernelArguments, KernelFunctionFromPrompt
from semantic_kernel.prompt_template import PromptTemplateConfig
from semantic_kernel.prompt_template.input_variable import InputVariable
from semantic_kernel_extended.custom_execution_settings import (
    CustomChatCompletionExecutionSettings,
)

from libs.application.application_context import AppContext
from libs.azure_helper.model.content_understanding import AnalyzedResult
from libs.pipeline.entities.mime_types import MimeTypes
from libs.pipeline.entities.pipeline_file import ArtifactType, PipelineLogEntry
from libs.pipeline.entities.pipeline_message_context import MessageContext
from libs.pipeline.entities.pipeline_step_result import StepResult
from libs.pipeline.entities.schema import Schema
from libs.pipeline.queue_handler_base import HandlerBase
from libs.utils.remote_module_loader import load_schema_from_blob


class MapHandler(HandlerBase):
    def __init__(self, appContext: AppContext, step_name: str, **data):
        super().__init__(appContext, step_name, **data)

    async def execute(self, context: MessageContext) -> StepResult:
        print(context.data_pipeline.get_previous_step_result(self.handler_name))

        # Get Output files from context.data_pipeline in files list where processed by 'extract' and artifact_type is 'extacted_content'
        output_file_json_string = self.download_output_file_to_json_string(
            processed_by="extract",
            artifact_type=ArtifactType.ExtractedContent,
        )

        # Deserialize the result to AnalyzedResult
        previous_result = AnalyzedResult(**json.loads(output_file_json_string))

        # Get Markdown content string from the previous result
        markdown_string = previous_result.result.contents[0].markdown

        # Prepare the prompt
        user_content = self._prepare_prompt(markdown_string)

        # Check file type : PDF
        if context.data_pipeline.get_source_files()[0].mime_type == MimeTypes.Pdf:
            # Convert PDF to multiple images
            pdf_bytes = context.data_pipeline.get_source_files()[0].download_stream(
                self.application_context.configuration.app_storage_blob_url,
                self.application_context.configuration.app_cps_processes,
            )

            pdf_stream = io.BytesIO(pdf_bytes)
            # Set the position to the beginning of the stream
            for image in convert_from_bytes(pdf_stream.read()):
                byteIO = io.BytesIO()
                image.save(byteIO, format="PNG")
                user_content.append(
                    self._convert_image_bytes_to_prompt("image/png", byteIO.getvalue())
                )
        # Check file type : Image - JPEG, PNG
        elif context.data_pipeline.get_source_files()[0].mime_type in [
            MimeTypes.ImageJpeg,
            MimeTypes.ImagePng,
        ]:
            # Extract Images
            user_content.append(
                self._convert_image_bytes_to_prompt(
                    context.data_pipeline.get_source_files()[0].mime_type,
                    context.data_pipeline.get_source_files()[0].download_stream(
                        self.application_context.configuration.app_storage_blob_url,
                        self.application_context.configuration.app_cps_processes,
                    ),
                )
            )

        # Check Schema Information
        selected_schema = Schema.get_schema(
            connection_string=self.application_context.configuration.app_cosmos_connstr,
            database_name=self.application_context.configuration.app_cosmos_database,
            collection_name=self.application_context.configuration.app_cosmos_container_schema,
            schema_id=context.data_pipeline.pipeline_status.schema_id,
        )

        # Invoke GPT with the prompt
        gpt_response_raw = await self.invoke_chat_completion(
            user_content, context, selected_schema
        )

        # Save Result as a file
        result_file = context.data_pipeline.add_file(
            file_name="gpt_output.json",
            artifact_type=ArtifactType.SchemaMappedData,
        )

        result_file.log_entries.append(
            PipelineLogEntry(
                **{
                    "source": self.handler_name,
                    "message": "GPT Extraction Result has been added",
                }
            )
        )

        result_file.upload_json_text(
            account_url=self.application_context.configuration.app_storage_blob_url,
            container_name=self.application_context.configuration.app_cps_processes,
            text=json.dumps(gpt_response_raw.value[0].inner_content.to_dict()),
        )

        return StepResult(
            process_id=context.data_pipeline.pipeline_status.process_id,
            step_name=self.handler_name,
            result={
                "result": "success",
                "file_name": result_file.name,
            },
        )

    async def invoke_chat_completion(
        self, user_content: list, context: MessageContext, selected_schema: Schema
    ):
        # Define the prompt template
        prompt = """
        system : You are an AI assistant that extracts data from documents.

        {{$history}}

        assistant :"""

        # Set Execution Settings - logprobs property doesn't spported in ExecutionSettings
        # So we had to  use CustomChatCompletionExecutionSettings
        # to set the logprobs property
        req_settings = CustomChatCompletionExecutionSettings()
        req_settings.service_id = "vision-agent"
        req_settings.structured_json_response = True
        req_settings.max_tokens = 4096
        req_settings.temperature = 0.1
        req_settings.top_p = 0.1
        req_settings.logprobs = True
        req_settings.response_format = load_schema_from_blob(
            account_url=self.application_context.configuration.app_storage_blob_url,
            container_name=f"{self.application_context.configuration.app_cps_configuration}/Schemas/{context.data_pipeline.pipeline_status.schema_id}",
            blob_name=selected_schema.FileName,
            module_name=selected_schema.ClassName,
        )

        prompt_template_config = PromptTemplateConfig(
            template=prompt,
            input_variables=[InputVariable(name="history", description="Chat history")],
            execution_settings=req_settings,
        )

        # Create Ad-hoc function with the prompt template
        chat_function = KernelFunctionFromPrompt(
            function_name="contentextractor",
            plugin_name="contentprocessplugin",
            prompt_template_config=prompt_template_config,
        )

        # Set Empty Chat History
        chat_history = ChatHistory()

        # Set User Prompot with Image and Text(Markdown) content
        chat_items = []
        for content in user_content:
            if content["type"] == "text":
                chat_items.append(TextContent(text=content["text"]))
            elif content["type"] == "image_url":
                chat_items.append(ImageContent(uri=content["image_url"]["url"]))

        # Add User Prompt to Chat History
        chat_history.add_message(
            ChatMessageContent(role=AuthorRole.USER, items=chat_items)
        )

        # Invoke the function with the chat history as a parameter in prompt teamplate
        return await self.application_context.kernel.invoke(
            chat_function, KernelArguments(history=chat_history)
        )

    def _convert_image_bytes_to_prompt(
        self, mime_string: str, image_stream: bytes
    ) -> list[dict]:
        """
        Add image to the prompt.
        """
        # Convert image to base64
        byteIO = io.BytesIO(image_stream)
        base64_encoded_data = base64.b64encode(byteIO.getvalue()).decode("utf-8")

        return {
            "type": "image_url",
            "image_url": {"url": f"data:{mime_string};base64,{base64_encoded_data}"},
        }

    def _prepare_prompt(self, markdown_string: str) -> list[dict]:
        """
        Prepare the prompt for the model.
        """
        user_content = []
        user_content.append(
            {
                "type": "text",
                "text": """Extract the data from this Document.
            - If a value is not present, provide null.
            - Some values must be inferred based on the rules defined in the policy and Contents.
            - Dates should be in the format YYYY-MM-DD.""",
            }
        )

        user_content.append({"type": "text", "text": markdown_string})

        return user_content
