"""Standalone database initialization and seeding helper script."""

from app.main import init_db_and_seed


if __name__ == "__main__":
    init_db_and_seed()
    print("EcoSort database initialized and seeded successfully.")
