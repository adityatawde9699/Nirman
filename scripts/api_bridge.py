"""Serve ASGI responses over stdio for DOM verification in a socket-restricted workspace."""

import base64
import json
import sys
import tempfile
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

sys.path[:0] = [
    str(Path(__file__).resolve().parents[1] / "backend"),
    str(Path(__file__).resolve().parents[1] / "backend/tests"),
]
from conftest import PipeLoop
from app import main
from app.database import get_db

engine = create_engine(
    "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
)
factory = sessionmaker(bind=engine, expire_on_commit=False)
main.engine = engine
main.SessionLocal = factory
folder = tempfile.TemporaryDirectory()
main.UPLOAD_DIR = Path(folder.name)


def db():
    with factory() as session:
        yield session


main.app.dependency_overrides[get_db] = db
with TestClient(main.app, backend_options={"loop_factory": PipeLoop}) as client:
    print(json.dumps({"ready": True}), flush=True)
    for line in sys.stdin:
        try:
            item = json.loads(line)
            kwargs = {"headers": item.get("headers", {})}
            if item.get("files"):
                f = item["files"]
                kwargs["files"] = {
                    "file": (f["name"], base64.b64decode(f["content"]), f["type"])
                }
                kwargs["data"] = item.get("data", {})
            elif item.get("body") is not None:
                kwargs["json"] = item["body"]
            response = client.request(item.get("method", "GET"), item["path"], **kwargs)
            print(
                json.dumps(
                    {
                        "id": item["id"],
                        "status": response.status_code,
                        "body": response.json(),
                    }
                ),
                flush=True,
            )
        except Exception as error:
            print(
                json.dumps(
                    {
                        "id": item.get("id"),
                        "status": 500,
                        "body": {"detail": str(error)},
                    }
                ),
                flush=True,
            )
folder.cleanup()
