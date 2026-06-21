"""Scraper modules for LinkedIn."""

from .base import BaseScraper
from .company_posts import CompanyPostsScraper

__all__ = [
    'BaseScraper',
    'CompanyPostsScraper',
]
