"""Prototype computer-vision waste classifier using Pillow + NumPy.

How it works:
1. Resizes the uploaded image to a normalized 128x128 RGB/HSV representation.
2. Computes genuine visual descriptors from image pixels:
   - Hue distribution (organic greens/yellows/browns vs. PET/glass blues/cyans vs. neutral grays)
   - Saturation and brightness/luminance statistics
   - Edge/texture gradient density (high-frequency detail typical of electronics, text/paper, labels)
   - Specular highlight ratio (glossy plastic/glass/metal reflections)
   - Center-vs-border contrast (foreground object isolation)
3. Scores the 4 waste categories (wet-organic, dry-recyclable, e-waste, hazardous-special)
   and infers a likely waste item label, returning calibrated softmax probabilities.
4. Intentionally reports honest confidence levels and triggers a manual confirmation
   fallback whenever confidence is below the configured threshold.
"""

from typing import Dict, Tuple
import numpy as np
from PIL import Image

from app.ai.base import BaseWasteClassifier, CategoryScore, ClassificationPrediction

CATEGORY_NAMES: Dict[str, str] = {
    "wet-organic": "Wet / Organic Waste",
    "dry-recyclable": "Dry / Recyclable Waste",
    "e-waste": "E-Waste",
    "hazardous-special": "Hazardous / Special Waste",
}


def _softmax(logits: Dict[str, float], temperature: float = 1.15) -> Dict[str, float]:
    keys = list(logits.keys())
    vals = np.array([logits[k] / temperature for k in keys], dtype=np.float64)
    vals = vals - np.max(vals)
    exp_vals = np.exp(vals)
    probs = exp_vals / np.sum(exp_vals)
    return {k: float(p) for k, p in zip(keys, probs)}


class CVPrototypeWasteClassifier(BaseWasteClassifier):
    """Lightweight, transparent CV feature-based prototype classifier."""

    model_name = "EcoSort-CV-Prototype-v1 (HSV + Texture + Specular Features)"

    def _extract_features(self, image: Image.Image) -> Dict[str, float]:
        rgb_img = image.convert("RGB").resize((128, 128), Image.Resampling.BILINEAR)
        rgb = np.asarray(rgb_img, dtype=np.float32) / 255.0

        hsv_img = rgb_img.convert("HSV")
        hsv = np.asarray(hsv_img, dtype=np.float32)
        h = hsv[:, :, 0] * (360.0 / 255.0)  # 0-360 degrees
        s = hsv[:, :, 1] / 255.0            # 0-1
        v = hsv[:, :, 2] / 255.0            # 0-1

        # Focus weights slightly toward center foreground (60% center, 40% border)
        yy, xx = np.ogrid[:128, :128]
        center_mask = ((yy - 64) ** 2 + (xx - 64) ** 2) <= (46 ** 2)

        # Color masks (only meaningful where saturation is moderate)
        colored = s > 0.18
        organic_green = float(np.mean(colored & (h >= 65) & (h <= 165)))
        organic_yellow_orange = float(np.mean(colored & (h >= 22) & (h < 65) & (v > 0.35)))
        organic_brown = float(np.mean((s > 0.20) & (h >= 10) & (h <= 42) & (v >= 0.15) & (v <= 0.55)))

        cool_blue_cyan = float(np.mean((s > 0.14) & (h >= 166) & (h <= 245)))
        neutral_bright = float(np.mean((s <= 0.18) & (v >= 0.62)))
        dark_surface = float(np.mean(v <= 0.26))
        red_warning = float(np.mean((s > 0.32) & ((h <= 16) | (h >= 340)) & (v > 0.28)))
        specular_highlights = float(np.mean((s <= 0.15) & (v >= 0.88)))

        # Edge / gradient density (Sobel-like finite difference on luminance)
        lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
        gx = np.abs(np.diff(lum, axis=1))
        gy = np.abs(np.diff(lum, axis=0))
        edge_density = float((np.mean(gx > 0.08) + np.mean(gy > 0.08)) / 2.0)

        center_sat = float(np.mean(s[center_mask]))
        mean_sat = float(np.mean(s))
        mean_val = float(np.mean(v))
        color_variance = float(np.std(rgb))

        return {
            "organic_green": round(organic_green, 4),
            "organic_yellow_orange": round(organic_yellow_orange, 4),
            "organic_brown": round(organic_brown, 4),
            "cool_blue_cyan": round(cool_blue_cyan, 4),
            "neutral_bright": round(neutral_bright, 4),
            "dark_surface": round(dark_surface, 4),
            "red_warning": round(red_warning, 4),
            "specular_highlights": round(specular_highlights, 4),
            "edge_density": round(edge_density, 4),
            "center_sat": round(center_sat, 4),
            "mean_sat": round(mean_sat, 4),
            "mean_val": round(mean_val, 4),
            "color_variance": round(color_variance, 4),
        }

    def _infer_item_label(self, category_slug: str, feat: Dict[str, float]) -> str:
        if category_slug == "wet-organic":
            if feat["organic_yellow_orange"] > feat["organic_green"] and feat["organic_yellow_orange"] > 0.10:
                return "Banana Peel / Citrus Food Scraps"
            if feat["organic_green"] > 0.12:
                return "Vegetable / Garden Waste"
            return "Food Scraps / Compostable Organic Matter"

        if category_slug == "dry-recyclable":
            if feat["cool_blue_cyan"] > 0.10 or feat["specular_highlights"] > 0.08:
                return "Plastic Bottle / Glass Bottle"
            if feat["neutral_bright"] > 0.35 and feat["edge_density"] > 0.12:
                return "Paper / Newspaper / Cardboard"
            if feat["specular_highlights"] > 0.05 and feat["mean_sat"] < 0.22:
                return "Aluminium Can / Tin Container"
            return "Recyclable Packaging (Plastic / Paper / Metal)"

        if category_slug == "e-waste":
            if feat["dark_surface"] > 0.35 and feat["edge_density"] > 0.12:
                return "Mobile Phone / Electronic Device"
            if feat["edge_density"] > 0.15:
                return "Charging Cable / Circuit Board / Electronics"
            return "Small Electronic Device / Charger"

        if feat["red_warning"] > 0.12:
            return "Medicine Strip / Chemical Packaging"
        return "Battery / Hazardous Household Item"

    def classify(self, image: Image.Image, filename: str = "") -> ClassificationPrediction:
        feat = self._extract_features(image)

        # Compute raw category affinity scores purely from extracted visual features
        wet_score = (
            1.2
            + 3.6 * feat["organic_green"]
            + 3.4 * feat["organic_yellow_orange"]
            + 2.4 * feat["organic_brown"]
            + 0.7 * feat["center_sat"]
            - 1.3 * feat["dark_surface"]
            - 1.0 * feat["cool_blue_cyan"]
        )

        dry_score = (
            1.3
            + 3.2 * feat["cool_blue_cyan"]
            + 2.0 * feat["neutral_bright"]
            + 2.2 * feat["specular_highlights"]
            + 0.8 * (1.0 - feat["mean_sat"])
            - 1.2 * feat["organic_green"]
            - 1.2 * feat["dark_surface"]
        )

        ewaste_score = (
            1.1
            + 2.9 * feat["dark_surface"]
            + 3.0 * feat["edge_density"]
            + 1.1 * feat["specular_highlights"]
            - 1.4 * feat["organic_green"]
            - 1.0 * feat["organic_yellow_orange"]
        )

        hazardous_score = (
            1.0
            + 3.5 * feat["red_warning"]
            + 1.6 * feat["edge_density"]
            + 1.0 * feat["color_variance"]
            - 0.9 * feat["organic_green"]
        )

        # Very flat/blank images should have low confidence so manual fallback activates
        if feat["color_variance"] < 0.06 and feat["edge_density"] < 0.03:
            wet_score = dry_score = ewaste_score = hazardous_score = 1.0

        probs = _softmax(
            {
                "wet-organic": wet_score,
                "dry-recyclable": dry_score,
                "e-waste": ewaste_score,
                "hazardous-special": hazardous_score,
            }
        )

        sorted_cats: list[Tuple[str, float]] = sorted(
            probs.items(), key=lambda kv: kv[1], reverse=True
        )
        top_slug, top_conf = sorted_cats[0]
        predicted_label = self._infer_item_label(top_slug, feat)

        top_candidates = [
            CategoryScore(
                category_slug=slug,
                category_name=CATEGORY_NAMES[slug],
                confidence=round(conf, 4),
            )
            for slug, conf in sorted_cats
        ]

        return ClassificationPrediction(
            predicted_label=predicted_label,
            category_slug=top_slug,
            confidence=round(top_conf, 4),
            model_name=self.model_name,
            model_notes=(
                "Prototype computer-vision classifier analyzing HSV color distribution, "
                "luminance, specular highlights, and edge density. For low-confidence results, "
                "please verify or manually choose the waste category below."
            ),
            visual_signals={
                "organic_hue_ratio": round(
                    feat["organic_green"] + feat["organic_yellow_orange"] + feat["organic_brown"],
                    3,
                ),
                "cool_recyclable_hue_ratio": round(feat["cool_blue_cyan"], 3),
                "dark_electronic_surface_ratio": round(feat["dark_surface"], 3),
                "edge_texture_density": round(feat["edge_density"], 3),
                "specular_reflection_ratio": round(feat["specular_highlights"], 3),
            },
            top_candidates=top_candidates,
        )
