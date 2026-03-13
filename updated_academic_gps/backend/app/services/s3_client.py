from __future__ import annotations

import json
import os

import boto3


class S3Client:
    def __init__(self) -> None:
        self.bucket = os.getenv("S3_BUCKET")
        self.key = os.getenv("S3_BRANCH_DATA_KEY", "updated-academic-gps/uoft_opportunities.json")
        self.region = os.getenv("AWS_REGION")
        self.enabled = bool(self.bucket and self.region and os.getenv("ENABLE_S3") == "true")
        self.client = boto3.client("s3", region_name=self.region) if self.enabled else None

    def load_seed_data(self) -> dict | None:
        if not self.enabled or not self.client:
            return None
        response = self.client.get_object(Bucket=self.bucket, Key=self.key)
        return json.loads(response["Body"].read().decode("utf-8"))
