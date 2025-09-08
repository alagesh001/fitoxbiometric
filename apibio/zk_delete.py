from zk import ZK

device_ip = '192.168.1.37'
zk = ZK(device_ip, port=4370, timeout=5, password=121212)

try:
    conn = zk.connect()
    print("✅ Connected to biometric device!")

    # ---- List Users ----
    print("\n📋 Current Users:")
    users = conn.get_users()
    for u in users:
        print(f"UID: {u.uid}, User ID: {u.user_id}, Name: {u.name}")

    # ---- Delete a User ----
    user_to_delete = '1221'  # change this ID
    conn.delete_user(user_id=user_to_delete)
    print(f"🗑️ Deleted User ID {user_to_delete}")

    # ---- Attendance Logs ----
    print("\n📌 Attendance Logs:")
    logs = conn.get_attendance()
    for log in logs:
        print(f"User ID: {log.user_id}, Time: {log.timestamp}")

    conn.disconnect()

except Exception as e:
    print("❌ Error:", e)