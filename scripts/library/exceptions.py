"""Filler."""


class PipelineError(Exception):
    """Data-pipeline error class."""


class PipelineWarning(Exception):
    """Data-pipeline warning class."""


class ParseError(PipelineError):
    """Parser error class."""


class ParseException(PipelineWarning):
    """Parser warning class."""
