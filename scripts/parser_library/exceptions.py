"""Filler."""

import jsonschema.exception


class PipelineError(Exception):
    """Data-pipeline error class."""


class PipelineWarning(Exception):
    """Data-pipeline warning class."""


class IngesterError(PipelineError):
    """Ingester error class."""


class IngesterWarning(PipelineWarning):
    """Ingester warning class."""


class ValidationError(PipelineError, jsonschema.exception.ValidationError):
    """Validator error class."""


class ValidationWarning(PipelineWarning):
    """Validator warning class."""


class JsonDuplicationWarning(ValidationWarning):
    """JSON definition has non-unique keys."""
