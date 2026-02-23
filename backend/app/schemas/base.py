"""Shared Pydantic base schemas for API responses."""

from pydantic import BaseModel, Field

DEFAULT_PAGINATION_LIMIT = 50
MAX_PAGINATION_LIMIT = 200


class PaginationParams(BaseModel):
    """Shared pagination params for list endpoints. Enforce max_limit=200."""

    limit: int = Field(default=DEFAULT_PAGINATION_LIMIT, ge=1, le=MAX_PAGINATION_LIMIT)
    offset: int = Field(default=0, ge=0)


class OrmSchema(BaseModel):
    """Base for response schemas that are built from ORM models."""

    model_config = {"from_attributes": True}


class StrictSchema(BaseModel):
    """Base for schemas that must not accept ORM attribute population."""

    model_config = {"from_attributes": False}
