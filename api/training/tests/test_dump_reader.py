import math

import pytest

from dump_reader import read_tables

DUMP = """--
-- PostgreSQL database dump
--
COPY public.rol (id, nombre, borrado) FROM stdin;
r1\tAdministrador\tf
r2\tOperador\tf
\\.

COPY public.unidad (id, abreviatura, nota) FROM stdin;
u1\tml\t\\N
\\.
"""


@pytest.fixture
def dump(tmp_path):
    path = tmp_path / "backup.sql"
    path.write_text(DUMP, encoding="utf-8")
    return path


def test_reads_the_requested_tables_with_their_columns(dump):
    tables = read_tables(dump, ["rol", "unidad"])
    assert list(tables["rol"].columns) == ["id", "nombre", "borrado"]
    assert tables["rol"]["nombre"].tolist() == ["Administrador", "Operador"]


def test_null_marker_becomes_nan(dump):
    note = read_tables(dump, ["unidad"])["unidad"]["nota"].iloc[0]
    assert isinstance(note, float) and math.isnan(note)


def test_a_missing_table_is_an_error_not_an_empty_frame(dump):
    with pytest.raises(ValueError, match="persona"):
        read_tables(dump, ["rol", "persona"])
