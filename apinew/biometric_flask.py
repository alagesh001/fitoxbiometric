from flask import Flask,send_from_directory, jsonify, request
from zk import ZK
import requests, os, platform,subprocess,sys,signal
from flask_cors import CORS
import webbrowser
from waitress import serve  # production-ready server
import pathlib
from threading import Timer,Thread
import psutil
import json

app = Flask(__name__)
frontend_path = pathlib.Path("frontend_build")
CORS(app)  # <-- enable CORS for all routes

# Path to JSON next to your .exe
exe_path = os.path.dirname(sys.executable)
CONFIG_FILE = os.path.join(exe_path, "device_config.json")

def load_device_config():
    if not os.path.exists(CONFIG_FILE):
        raise Exception(f"Config file not found: {CONFIG_FILE}")
    with open(CONFIG_FILE, "r") as f:
        return json.load(f)
    
cfg = load_device_config()
DEVICE_IP = cfg.get("DEVICE_IP")
DEVICE_PORT = int(cfg.get("DEVICE_PORT", 4370))
DEVICE_PASS = int(cfg.get("DEVICE_PASS", 0))


VPS_API = "https://your-vps.com/api/expired-members"

# Open frontend once after server starts
def save_config(config):
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)

def get_next_uid():
    config = load_device_config()
    last_uid = config.get("LAST_UID", 0)
    new_uid = last_uid + 1
    config["LAST_UID"] = new_uid
    save_config(config)
    return new_uid   
    
def ping_device(ip):
    """Check if device is reachable via ping without opening a console."""
    param = "-n" if platform.system().lower() == "windows" else "-c"
    try:
        subprocess.run(
            ["ping", param, "1", ip],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW  # prevents hidden CMD
        )
        return True
    except:
        return False

def connect_device():
    """Connect to biometric device safely."""
    if not ping_device(DEVICE_IP):
        raise Exception(f"can't reach device (ping {DEVICE_IP})")
    zk = ZK(DEVICE_IP, port=DEVICE_PORT, timeout=5, password=DEVICE_PASS)
    return zk.connect()

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    requested_file = frontend_path / path
    if path != "" and requested_file.exists():
        return send_from_directory(frontend_path, path)
    elif path.startswith("assets/"):
        # Serve Vite assets
        return send_from_directory(frontend_path, path)
    else:
        # Serve index.html for React routing
        return send_from_directory(frontend_path, "index.html")

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

@app.route("/add-user", methods=["POST"])
def add_user():
    data = request.get_json(silent=True) or request.form

    try:
        user_id = str(data.get("user_id"))
        name = str(data.get("name"))
        privilege = int(data.get("privilege", 0))
        password = str(data.get("password", ""))
        group_id = str(data.get("group_id", ""))
        card = int(data.get("card", 0))
    except Exception as e:
        return jsonify({"error": f"Invalid input types: {e}"}), 400

    if not user_id or not name:
        return jsonify({"error": "user_id and name are required"}), 400

    try:
        conn = connect_device()
        new_uid = get_next_uid()

        # ✅ Direct call instead of User()
        conn.set_user(
            uid=new_uid,
            name=name,
            privilege=privilege,
            password=password,
            group_id=group_id,
            user_id=user_id,
            card=card
        )

        conn.disconnect()

        return jsonify({"success": True, "message": f"User {name} ({user_id}) added successfully"})
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
    

# if __name__ == "__main__":

#     Thread(target=lambda: webbrowser.open("http://127.0.0.1:5000")).start()
#     app.run(host="0.0.0.0", port=5000, debug=True)
def open_frontend():
    url = "http://localhost:5000"
    if sys.platform == "win32":
        app_dir = os.path.dirname(sys.executable)  # Path where your .exe is
        subprocess.Popen(
            f'start "" "{url}"',
            shell=True,
            cwd=app_dir,
            creationflags=subprocess.CREATE_NO_WINDOW  # <--- prevents hidden cmd
        )
# Lock file alternative if psutil is not installed
def kill_previous_instances():
    exe_name = os.path.basename(sys.executable)
    current_pid = os.getpid()

    for proc in psutil.process_iter(['pid', 'name']):
        if proc.info['name'] == exe_name and proc.info['pid'] != current_pid:
            print(f"Killing previous instance (PID {proc.info['pid']})")
            proc.kill()  # forc

# Run Waitress server
def run_server():
    serve(app, host="127.0.0.1", port=5000)

if __name__ == "__main__":
    # Kill any previous running instances
    kill_previous_instances()

    # Start server in background thread
    server_thread = Thread(target=run_server, daemon=True)
    server_thread.start()

    # Open browser after 1 second
    Timer(1, open_frontend).start()

    # Keep main thread alive
    server_thread.join()