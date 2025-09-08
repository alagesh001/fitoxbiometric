from zk import ZK

device_ip = '192.168.1.37'

zk = ZK(device_ip, port=4370, timeout=5, password=121212)  # password=0 unless device admin password is set

try:
    conn = zk.connect()
    print("✅ Connected to biometric device!")

    print("\nFetching attendance logs...")
    logs = conn.get_attendance()
    for log in logs:
        print(f"User ID: {log.user_id}, Time: {log.timestamp}")

    conn.disconnect()
except Exception as e:
    print("❌ Error:", e)


from zk import ZK, const

device_ip = '192.168.1.37'

zk = ZK(device_ip, port=4370, timeout=5, password=121212)  # password=0 unless device admin password is set


