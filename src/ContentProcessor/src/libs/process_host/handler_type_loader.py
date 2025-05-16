import importlib

from libs.pipeline.queue_handler_base import HandlerBase


def load(process_step: str) -> HandlerBase:
    """
    This function is used to load the processor based on the queue name.
    """

    module_name = f"libs.pipeline.handlers.{process_step}_handler"
    class_name = f"{process_step.capitalize()}Handler"

    try:
        module = importlib.import_module(module_name)
        dynamic_class = getattr(module, class_name)
        return dynamic_class
    except (ModuleNotFoundError, AttributeError) as e:
        raise Exception(f"Error loading processor {class_name}: {e}")
