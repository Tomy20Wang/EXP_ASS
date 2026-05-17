from dataclasses import dataclass, field
from typing import Any, Dict


@dataclass
class TaskResult:
    success: bool
    message: str
    output_path: str
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "message": self.message,
            "outputPath": self.output_path,
            "metadata": self.metadata,
        }
