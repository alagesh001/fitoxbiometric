import React, { useState, useEffect } from "react";
import { UserPlus, Trash2,RefreshCcw } from "lucide-react";
import Swal from "sweetalert2";

export default function BiometricDashboard() {
const API_BASE =  "http://localhost:5000";
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userIdsInput, setUserIdsInput] = useState("");
  const [maxUid, setMaxUid] = useState(null);

  const DEFAULTS = {
    privilege: 0,
    password: "",
    group_id: "",
    card: 0,
  };
   const handleAddUser = async () => {
    if (!name || !userId) {
    setMessage("❌ Name and User ID are required");
      return;
    }
      setLoading(true);

    setMessage("Connecting to device...");

    const body = {
      user_id: userId,
      name: name,
      ...DEFAULTS,
    };

    try {
      const res = await fetch("http://localhost:5000/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
setMessage(`✅ ${JSON.stringify(data.message)}`);
setName("");
setUserId("");
    } catch (err) {

setMessage(`❌ ${err.message}`);

    }
      setLoading(false);

  };
  // Fetch users from biometric device

    const fetchMaxUid = async () => {
    setLoading(true);
    setMessage("");
    setMaxUid(null);

    try {
      const res = await fetch("http://localhost:5000/max-uid");
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to fetch UID");
      } else {
        setMaxUid(data.max_uid);
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

 const fetchUsers = async () => {
  setLoading(true);
  setMessage("Fetching new list..."); // clear previous message
  try {
    const res = await fetch(`${API_BASE}/users`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
          setMessage("✅ Updated list");

    setUsers(data);
  } catch (error) {
    console.error("Error fetching users:", error);
    setMessage("❌ Failed to load users");
  } finally {
    setLoading(false);
  }
};

const clearLogs = async () => {
  if (!window.confirm("Clear all logs from the device?")) return;
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/clear-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    setMessage(data.message || "✅ Logs cleared");
    fetchLogs(); // Refresh logs after clearing
  } catch (err) {
    console.error(err);
    setMessage("❌ Failed to clear logs");
  }
  setLoading(false);
};
  // Fetch attendance logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/logs`);
      const data = await res.json();
      setLogs(data);
    } catch {
      setMessage("❌ Failed to load logs");
    }
    setLoading(false);
  };

  // Delete a single user
  const deleteUser = async (userId) => {
    if (!window.confirm(`Delete user ${userId}?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/delete-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      setMessage(data.message || "✅ Deleted");
      fetchUsers();
    } catch {
      setMessage("❌ Failed to delete user");
    }
    setLoading(false);
  };

  // Remove expired members (or custom IDs)
  const removeExpired = async () => {
    setMessage("Connecting to device...")
    setLoading(true);
    try {
      let payload = {};
      if (userIdsInput.trim()) {
        const userIds = userIdsInput
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id);
        payload = { user_ids: userIds };
      }

      const res = await fetch(`${API_BASE}/remove-expired-members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: Object.keys(payload).length ? JSON.stringify(payload) : null,
      });
    setMessage("Removing Access...")

      const data = await res.json();
          setMessage("Success")

      console.log("Expired sync result:", data);
      setMessage("✅ Remove Success");
      setUserIdsInput("");
      //fetchUsers();
    } catch {
      setMessage("❌ Failed to remove expired");
    }
    setLoading(false);
  };

  useEffect(() => {
  //  fetchUsers();
   // fetchLogs();
  }, []);

 return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-indigo-200 p-8 space-y-8">
      {/* Page Title */}
      <h1 className="text-3xl font-extrabold text-center text-indigo-700 drop-shadow-sm">
        Fitox Biometric Handle
      </h1>
{loading && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
    <div className="flex flex-col items-center space-y-4">
      {/* Spinner */}
      <svg
        className="animate-spin h-12 w-12 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8z"
        ></path>
      </svg>

      {/* Loading Text */}
      <p className="text-white text-lg font-semibold tracking-wide">
        Processing...
      </p>
    </div>
  </div>
)}
      {/* Add User Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
            
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <UserPlus className="text-indigo-600" /> Add Biometric User
        </h2>

        <input
          type="text"
          placeholder="Enter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
        />

        <input
          type="text"
          placeholder="Enter User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
        />

      <button
  onClick={() => {
    Swal.fire({
      title: "Add User?",
      text: "Are you sure you want to add this user?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5", // Indigo
      cancelButtonColor: "#6b7280", // Gray
      confirmButtonText: "Yes, Add",
    }).then((result) => {
      
      if (result.isConfirmed) {
        handleAddUser();
       // Swal.fire("Added!", "The user has been added successfully.", "success");
      }
    });
  }}
  className="w-full py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all"
>
  Add User
</button>
      </div>

      {/* Remove Access Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Trash2 className="text-yellow-600" /> Remove User Access
        </h2>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter User IDs (comma-separated)"
            value={userIdsInput}
            onChange={(e) => setUserIdsInput(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
          />
          
         
        </div>
   <button
  onClick={() => {
    Swal.fire({
      title: "Remove Users?",
      text: "Are you sure you want to remove selected users?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#eab308", // Yellow
      cancelButtonColor: "#6b7280", // Gray
      confirmButtonText: "Yes, Remove",
    }).then((result) => {
      if (result.isConfirmed) {
        removeExpired();
      //  Swal.fire("Removed!", "User access removed successfully.", "success");
      }
    });
  }}
  className="w-full py-2 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white px-4 transition-all"
>
  {loading ? "Removing..." : "Remove"}
</button>
      </div>
        {/* Message Section */}
      {message && (
        <div className="text-center text-lg font-medium text-indigo-700 bg-indigo-50 py-3 px-4 rounded-xl shadow-sm">
          {message}
        </div>
      )}
        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <RefreshCcw className="text-red-600" /> Reset Max UID
        </h2>

      <button
        onClick={fetchMaxUid}
        disabled={loading}
       className={`w-full h-12 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 flex justify-center items-center space-x-2 ${
  loading ? "opacity-70 cursor-not-allowed" : ""
}`}

      >
      Click to Reset Max UID
      </button>

      {maxUid !== null && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-center">
          Max UID: <strong>{maxUid}</strong>
        </div>
      )}
 </div>

    
    </div>
  );
}


//  return (
//     <div className="min-h-screen bg-gray-100 p-6 space-y-6">
//       <h1 className="text-2xl font-bold text-center mb-4">
//         Fitox Biometric Remove Access
//       </h1>

//       {/* Users Section */}
//       <div className="bg-white rounded-2xl shadow-lg p-4">
//        {/*  <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-semibold">Users</h2>
//           <div className="flex gap-2">
//             <button
//               className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
//               onClick={fetchUsers}
//               disabled={loading}
//             >
//               Refresh
//             </button>
//           </div>
//         </div>

//         <ul className="divide-y max-h-64 overflow-y-auto">
//           {users.map((u) => (
//             <li
//               key={u.user_id}
//               className="flex justify-between items-center py-2"
//             >
//               <span>{u.name || "Unnamed"} (ID: {u.user_id})</span>
//               <button
//                 className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
//                 onClick={() => deleteUser(u.user_id)}
//                 disabled={loading}
//               >
//                 Delete
//               </button>
//             </li>
//           ))}
//         </ul>
// <div className="mt-4">
//   <button
//     className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
//     onClick={clearLogs}
//     disabled={loading}
//   >
//     Clear Logs
//   </button>
// </div>
// */}
// <h2 className="text-xl font-semibold mb-4">Add Biometric User</h2>

//       <input
//         type="text"
//         placeholder="Enter Name"
//         value={name}
//         onChange={(e) => setName(e.target.value)}
//         className="w-full px-3 py-2 mb-3 rounded-lg border focus:ring-2 focus:ring-indigo-300"
//       />

//       <input
//         type="text"
//         placeholder="Enter User ID"
//         value={userId}
//         onChange={(e) => setUserId(e.target.value)}
//         className="w-full px-3 py-2 mb-3 rounded-lg border focus:ring-2 focus:ring-indigo-300"
//       />

//       <button
//         onClick={handleAddUser}
//         className="w-full py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
//       >
//         Add User
//       </button>
//         {/* Custom IDs input */}
//         <div className="mt-4 flex gap-2">
//           <input
//             type="text"
//             placeholder="Enter User IDs comma-separated"
//             value={userIdsInput}
//             onChange={(e) => setUserIdsInput(e.target.value)}
//             className="border p-2 rounded flex-1"
//           />
//           <button
//             className="bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600"
//             onClick={removeExpired}
//             disabled={loading}
//           >
//             Remove Access
//           </button>
//         </div>
//       </div>

//       {/* Logs Section */}
//   {/*    <div className="bg-white rounded-2xl shadow-lg p-4">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-semibold">Attendance Logs</h2>
//           <button
//             className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
//             onClick={fetchLogs}
//             disabled={loading}
//           >
//             Refresh
//           </button>
//         </div>

//         <ul className="divide-y max-h-64 overflow-y-auto text-sm">
//           {logs.map((l, i) => (
//             <li key={i} className="py-1">
//               User {l.user_id} → {new Date(l.time).toLocaleString()}
//             </li>
//           ))}
//         </ul>
//       </div>
//  */}
//       {message && <div className="text-center text-blue-600">{message}</div>}
//     </div>
//   );