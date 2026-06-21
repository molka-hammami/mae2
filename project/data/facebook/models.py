from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class Comment(BaseModel):
    author: Optional[str] = None
    text: str
    url: Optional[str] = None
    comment_date: Optional[str] = None
    replies: List["Comment"] = Field(default_factory=list)


class PostData(BaseModel):
    url: str
    post_id: str
    author: Optional[str] = None
    caption: str = ""
    date_post: Optional[str] = None
    comments_count_displayed: int = 0
    shares_count_displayed: int = 0
    comments_full: List[Comment] = Field(default_factory=list)