"""LinkedIn Scraper - Async Playwright-based scraper for LinkedIn."""

# Version
__version__ = "3.1.1"

# Core modules
from .core import (
    BrowserManager,
    login_with_credentials,
    is_logged_in,
    wait_for_manual_login,
    load_credentials_from_env,
    # Exceptions
    LinkedInScraperException,
    AuthenticationError,
    RateLimitError,
    ElementNotFoundError,
    ProfileNotFoundError,
    NetworkError,
    ScrapingError,
)

# Scrapers
from .scrapers import (
    CompanyPostsScraper,
)

# Callbacks
from .callbacks import (
    ProgressCallback,
    ConsoleCallback,
    SilentCallback,
    JSONLogCallback,
    MultiCallback,
)

# Models
from .models import (
    Post,
)

__all__ = [
    # Version
    "__version__",
    # Core
    "BrowserManager",
    "login_with_credentials",
    "is_logged_in",
    "wait_for_manual_login",
    "load_credentials_from_env",
    # Scrapers
    "CompanyPostsScraper",
    # Exceptions
    "LinkedInScraperException",
    "AuthenticationError",
    "RateLimitError",
    "ElementNotFoundError",
    "ProfileNotFoundError",
    "NetworkError",
    "ScrapingError",
    # Callbacks
    "ProgressCallback",
    "ConsoleCallback",
    "SilentCallback",
    "JSONLogCallback",
    "MultiCallback",
    # Models
    "Post",
]
