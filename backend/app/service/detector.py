from ultralytics import YOLO

class GarbageDetector:

    def __init__(self, model_path: str):
        self.model = YOLO(model_path)

    def detect(self, image_path: str):

        results = self.model.predict(
            source=image_path,
            conf=0.40,
            verbose=False,
            device="cpu"
        )

        detections = []

        for result in results:
            for box in result.boxes:

                detections.append({
                    "class_id": int(box.cls),
                    "class_name": self.model.names[int(box.cls)],
                    "confidence": float(box.conf),
                    "bbox": box.xyxy.tolist()[0]
                })

        return detections