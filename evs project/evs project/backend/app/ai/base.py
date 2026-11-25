"""Abstract base interface for EcoSort AI waste classifiers.

Keeping this contract separate from FastAPI routes allows swapping the
computer-vision prototype for a fine-tuned MobileNet/YOLO/ONNX or external
vision model later without changing API contracts or frontend code.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List
from PIL import Image


@dataclass
class CategoryScore:
    category_slug: str
    category_name: str
    confidence: float


@dataclass
class ClassificationPrediction:
    predicted_label: str
    category_slug: str
    confidence: float
    model_name: str
    model_notes: str
    visual_signals: Dict[str, float | str] = field(default_factory=dict)
    top_candidates: List[CategoryScore] = field(default_factory=list)


class BaseWasteClassifier(ABC):
    """Interface that any waste image classifier implementation must satisfy."""

    @abstractmethod
    def classify(self, image: Image.Image, filename: str = "") -> ClassificationPrediction:
        """Predict waste category and probable item label from a PIL image."""
        raise NotImplementedError
