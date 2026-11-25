"""AI Classification Service connecting image analysis to the Waste Database."""

from io import BytesIO
from typing import List, Optional
from PIL import Image, UnidentifiedImageError
from sqlalchemy.orm import Session

from app.ai.base import BaseWasteClassifier
from app.ai.cv_classifier import CVPrototypeWasteClassifier
from app.core.config import get_settings
from app.models.waste import WasteCategory, WasteItem

settings = get_settings()


def get_classifier() -> BaseWasteClassifier:
    """Factory returning the configured AI classifier implementation.

    To upgrade to a trained PyTorch/ONNX/Cloud model later, implement
    BaseWasteClassifier and select it via AI_PROVIDER in `.env`.
    """
    return CVPrototypeWasteClassifier()


class WasteClassificationService:
    """Validates uploaded images, runs classification, and resolves DB disposal rules."""

    def __init__(self, classifier: Optional[BaseWasteClassifier] = None):
        self.classifier = classifier or get_classifier()

    def classify_image_bytes(
        self,
        db: Session,
        raw_bytes: bytes,
        filename: str = "",
    ) -> dict:
        if not raw_bytes:
            raise ValueError("Uploaded image file is empty.")
        if len(raw_bytes) > settings.max_upload_size_bytes:
            raise ValueError(
                f"Image exceeds the maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB} MB."
            )

        try:
            with Image.open(BytesIO(raw_bytes)) as img:
                img.verify()
            with Image.open(BytesIO(raw_bytes)) as img:
                image_rgb = img.convert("RGB")
        except (UnidentifiedImageError, OSError) as exc:
            raise ValueError(
                "Invalid or unsupported image file. Please upload a valid JPG, PNG, or WEBP photo."
            ) from exc

        prediction = self.classifier.classify(image_rgb, filename=filename)

        category = (
            db.query(WasteCategory)
            .filter(WasteCategory.slug == prediction.category_slug)
            .first()
        )
        if not category:
            category = db.query(WasteCategory).first()

        # Match candidate items from the database for the predicted category
        category_items: List[WasteItem] = (
            db.query(WasteItem)
            .filter(WasteItem.category_id == category.id)
            .order_by(WasteItem.search_count.desc(), WasteItem.id.asc())
            .all()
        )

        matched_item = self._pick_best_item(prediction.predicted_label, category_items)
        suggested_items = category_items[:4]
        needs_manual = prediction.confidence < settings.AI_CONFIDENCE_THRESHOLD

        if matched_item:
            recommended_action = (
                f"{matched_item.bin_type} — {matched_item.disposal_method_text}"
            )
        else:
            recommended_action = f"Use {category.bin_label}: {category.description}"

        return {
            "predicted_label": matched_item.name if (matched_item and not needs_manual) else prediction.predicted_label,
            "predicted_category_slug": category.slug,
            "predicted_category": category,
            "confidence": prediction.confidence,
            "confidence_percent": int(round(prediction.confidence * 100)),
            "needs_manual_confirmation": needs_manual,
            "model_name": prediction.model_name,
            "model_notes": prediction.model_notes,
            "visual_signals": prediction.visual_signals,
            "top_candidates": [
                {
                    "category_slug": c.category_slug,
                    "category_name": c.category_name,
                    "confidence": c.confidence,
                }
                for c in prediction.top_candidates
            ],
            "matched_item": matched_item,
            "suggested_items": suggested_items,
            "recommended_action": recommended_action,
        }

    @staticmethod
    def _pick_best_item(predicted_label: str, items: List[WasteItem]) -> Optional[WasteItem]:
        if not items:
            return None
        tokens = [
            t.strip().lower()
            for t in predicted_label.replace("/", " ").split()
            if len(t.strip()) > 2
        ]
        best_item = items[0]
        best_score = -1
        for item in items:
            haystack = f"{item.name} {item.keywords} {item.description}".lower()
            score = sum(1 for tok in tokens if tok in haystack)
            if score > best_score:
                best_score = score
                best_item = item
        return best_item
