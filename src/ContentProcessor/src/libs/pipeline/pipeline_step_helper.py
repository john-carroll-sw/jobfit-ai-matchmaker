from typing import Optional

from libs.pipeline.entities.pipeline_status import PipelineStatus


def get_next_step_name(
    status: PipelineStatus, current_step: Optional[str] = None
) -> str:
    """find the next step name"""
    next_index = status.steps.index(status.active_step) + 1
    if next_index < len(status.steps):
        return status.steps[next_index]
    else:
        return None
