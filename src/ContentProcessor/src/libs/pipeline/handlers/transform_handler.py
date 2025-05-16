# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

from libs.application.application_context import AppContext
from libs.pipeline.entities.pipeline_message_context import MessageContext
from libs.pipeline.entities.pipeline_step_result import StepResult
from libs.pipeline.queue_handler_base import HandlerBase


class TransformHandler(HandlerBase):
    def __init__(self, appContext: AppContext, step_name: str, **data):
        super().__init__(appContext, step_name, **data)

    async def execute(self, context: MessageContext) -> StepResult:
        print(context.data_pipeline.get_previous_step_result(self.handler_name))

        #########################################################
        # Placeholder to add your transformation logic
        #########################################################
        # Put processing result in the result
        # return StepResult(
        #     process_id=context.data_pipeline.pipeline_status.process_id,
        #     step_name=self.handler_name,
        #     result={"result": <<Result File Name>>},
        # )

        return StepResult(
            process_id=context.data_pipeline.pipeline_status.process_id,
            step_name=self.handler_name,
            result={"result": "success"},
        )
