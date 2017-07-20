"""Filler."""

import jsonschema.exceptions


class PipelineError(Exception):
    """Data-pipeline error class."""


class PipelineWarning(Exception):
    """Data-pipeline warning class."""


class IngesterError(PipelineError):
    """Ingester error class."""


class IngesterWarning(PipelineWarning):
    """Ingester warning class."""


class ValidationError(PipelineError, jsonschema.exceptions.ValidationError):
    """Validator error class."""


class ValidationWarning(PipelineWarning):
    """Validator warning class."""


class JsonDuplicationWarning(ValidationWarning):
    """JSON definition has non-unique keys."""


class ParseError(PipelineError):
    """Parser error class."""


class ParseException(PipelineWarning):
    """Parser warning class."""
