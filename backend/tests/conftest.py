"""Isolated API tests; pipe wakeups allow execution without network sockets."""

import asyncio
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import get_db
from app import main


class PipeLoop(asyncio.SelectorEventLoop):
    def _make_self_pipe(self):
        self._pipe_r, self._pipe_w = os.pipe2(os.O_NONBLOCK | os.O_CLOEXEC)
        self._add_reader(self._pipe_r, self._read_from_self)

    def _write_to_self(self):
        try:
            os.write(self._pipe_w, b"\0")
        except (OSError, AttributeError):
            pass

    def _read_from_self(self):
        try:
            while os.read(self._pipe_r, 4096):
                pass
        except OSError:
            pass

    def _close_self_pipe(self):
        self._remove_reader(self._pipe_r)
        os.close(self._pipe_r)
        os.close(self._pipe_w)


@pytest.fixture
def client(tmp_path, monkeypatch):
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(connection, _record):
        connection.execute("PRAGMA foreign_keys=ON")

    factory = sessionmaker(bind=engine, expire_on_commit=False)
    monkeypatch.setattr(main, "engine", engine)
    monkeypatch.setattr(main, "SessionLocal", factory)
    monkeypatch.setattr(main, "UPLOAD_DIR", tmp_path)
    main.sessions.clear()

    def session():
        with factory() as db:
            yield db

    main.app.dependency_overrides[get_db] = session
    with TestClient(main.app, backend_options={"loop_factory": PipeLoop}) as c:
        yield c
    main.app.dependency_overrides.clear()
    engine.dispose()


@pytest.fixture
def applicant(client):
    r = client.post("/api/auth/login", json={"email": "entrepreneur@nirman.demo"})
    return {"Authorization": "Bearer " + r.json()["token"]}


@pytest.fixture
def officer(client):
    r = client.post("/api/auth/login", json={"email": "officer@nirman.demo"})
    return {"Authorization": "Bearer " + r.json()["token"]}


@pytest.fixture
def admin(client):
    r = client.post("/api/auth/login", json={"email": "admin@nirman.demo"})
    return {"Authorization": "Bearer " + r.json()["token"]}
