from typing import Any


class SimpleLogger:
    """Simple logger that just prints messages like print()"""

    def __init__(self, name: str = "metabench"):
        self.name = name

    def _format_message(self, level: str, message: Any) -> str:
        """Format message with level and logger name"""
        return f"[{self.name}] :: {level}: {message}"

    def info(self, message: Any) -> None:
        """Log info message"""
        print(self._format_message("INFO", message))

    def error(self, message: Any) -> None:
        """Log error message"""
        print(f"\033[91m{self._format_message('ERROR', message)}\033[0m")  # Red

    def warning(self, message: Any) -> None:
        """Log warning message"""
        print(f"\033[93m{self._format_message('WARNING', message)}\033[0m")  # Yellow

    def debug(self, message: Any) -> None:
        """Log debug message"""
        print(self._format_message("DEBUG", message))

    def success(self, message: Any) -> None:
        """Log success message"""
        print(f"\033[92m{self._format_message('SUCCESS', message)}\033[0m")  # Green

    def simple_print(self, message: Any) -> None:
        """Log message without any formatting"""
        print(message)


# Create a default logger instance
logger = SimpleLogger()


# Function to get logger instances
def get_logger(name: str = "metabench") -> SimpleLogger:
    """Get a logger instance with the specified name"""
    return SimpleLogger(name)
