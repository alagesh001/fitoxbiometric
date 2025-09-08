from flask import Flask,send_from_directory, jsonify, request
from zk import ZK
import requests, os, platform
from flask_cors import CORS
import webbrowser
from threading import Thread
from waitress import serve  # production-ready server

app = Flask(__name__, static_folder="frontend_build")
CORS(app)  # <-- enable CORS for all routes
DEVICE_IP = "192.168.1.37"
DEVICE_PORT = 4370
DEVICE_PASS = 121212

VPS_API = "https://your-vps.com/api/expired-members"

def ping_device(ip):
    """Check if device is reachable via ping."""
    param = "-n" if platform.system().lower() == "windows" else "-c"
    return os.system(f"ping {param} 1 {ip} > nul 2>&1") == 0

def connect_device():
    """Connect to biometric device safely."""
    if not ping_device(DEVICE_IP):
        raise Exception(f"can't reach device (ping {DEVICE_IP})")
    zk = ZK(DEVICE_IP, port=DEVICE_PORT, timeout=5, password=DEVICE_PASS)
    return zk.connect()

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    if path != "" and (app.static_folder / path).exists():
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

@app.route("/logs", methods=["GET"])
def get_logs():
    try:
        conn = connect_device()
        logs = conn.get_attendance()
        conn.disconnect()

        result = [
            {"user_id": log.user_id, "time": str(log.timestamp)}
            for log in logs
        ]
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/users", methods=["GET"])
def get_users():
    try:
        conn = connect_device()
        users = conn.get_users()
        conn.disconnect()

        result = [
            {"uid": u.uid, "user_id": u.user_id, "name": u.name}
            for u in users
        ]
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/delete-user", methods=["POST"])
def delete_user():
    data = request.get_json(silent=True) or request.form
    user_id = data.get("user_id")
    
    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    try:
        conn = connect_device()
        conn.delete_user(user_id=user_id)
        conn.disconnect()
        return jsonify({"success": True, "message": f"User {user_id} deleted"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/remove-expired-members", methods=["POST"])
def remove_expired_members():
    try:
        # Step 1: Fetch expired members from VPS
       # response = requests.get(VPS_API)
       # expired_members = response.json().get("expired_members", [])
        data = request.get_json(silent=True) or request.form
        expired_members = data.get("user_ids")
    # If user_ids is a string from form, convert to list
        if isinstance(expired_members, str):
            # Assume comma-separated string from form input
            expired_members = [uid.strip() for uid in expired_members.split(",") if uid.strip()]

        if not expired_members:
            return jsonify({"success": True, "message": "No expired members to remove."})

        # Step 2: Connect to device
        conn = connect_device()

        # Step 3: Delete users
        results = []
        for member_id in expired_members:
            try:
                conn.delete_user(user_id=str(member_id))
                results.append({"user_id": member_id, "status": "deleted"})
            except Exception as e:
                results.append({"user_id": member_id, "status": f"error: {e}"})

        conn.disconnect()
        return jsonify({"success": True, "results": results})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/clear-logs", methods=["POST"])
def clear_logs():
    """
    Clears attendance logs from the biometric device.
    """
    try:
        # Step 1: Connect to device
        conn = connect_device()

        # Step 2: Clear attendance logs (flag=1 for logs)
        success = conn.clear_attendance()  # pyzk SDK method
        conn.disconnect()

        if success:
            return jsonify({"success": True, "message": "Logs cleared successfully"})
        else:
            return jsonify({"success": False, "message": "Failed to clear logs"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":

    Thread(target=lambda: webbrowser.open("http://127.0.0.1:5000")).start()
    app.run(host="0.0.0.0", port=5000, debug=True)
