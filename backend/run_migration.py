import sqlite3

conn = sqlite3.connect("testmate.db")
cur = conn.cursor()

migrations = [
    ("users",            "jira_access_token",  "TEXT"),
    ("users",            "jira_refresh_token",  "TEXT"),
    ("users",            "jira_cloud_id",       "TEXT"),
    ("jira_integrations","space_cloud_id",      "TEXT"),
]

for table, col, typ in migrations:
    try:
        cur.execute(f"ALTER TABLE {table} ADD COLUMN {col} {typ}")
        print(f"Added {table}.{col}")
    except sqlite3.OperationalError as e:
        print(f"Skipped {table}.{col}: {e}")

conn.commit()
conn.close()
print("Done.")