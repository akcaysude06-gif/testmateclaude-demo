import sqlite3

conn = sqlite3.connect("testmate.db")
cur = conn.cursor()

for col in ["jira_access_token", "jira_refresh_token", "jira_cloud_id"]:
	try:
		cur.execute(f"ALTER TABLE users ADD COLUMN {col} TEXT")
		print(f"Added column: {col}")
	except sqlite3.OperationalError as e:
		print(f"Skipped {col}: {e}")

conn.commit()
conn.close()
print("Done.")