"""WPipe DAG definition module for NeuralForge API Gateway."""

from wpipe import Pipeline

from states.dispatch_study_step import dispatch_study_step
from states.validate_config_step import validate_config_step

VERSION: str = "v1.5.0"


def neuralforge_api_training_pipeline() -> Pipeline:
    """Builds and returns the primary training study dispatch pipeline.

    DAG: validate_config_step -> dispatch_study_step

    Returns:
        Pipeline: Configured WPipe pipeline instance for training submission.
    """
    pipeline = Pipeline(
        pipeline_name="neuralforge_api_training_pipeline",
        pipeline_version=VERSION,
        show_progress=False,
        verbose=False,
        max_retries=0,
    )
    pipeline.set_steps(
        [
            validate_config_step,
            dispatch_study_step,
        ]
    )
    return pipeline
